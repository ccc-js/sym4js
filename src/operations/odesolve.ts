import { type Expression, Integer, Symbol, Add, Mul, Pow, Neg, Div, Zero, One, createNeg } from '../core/expr.js'
import { integrate } from './integrate.js'
import { Exp, Sin, Cos } from '../functions/trig.js'

export interface ODESolution {
  general: Expression
  particular?: Expression
  method: string
}

export interface BoundaryConditions {
  x0: Expression
  y0: Expression
  x1?: Expression
  y1?: Expression
}

export function dsolve(
  equation: Expression,
  y: Symbol,
  options?: {
    initialConditions?: Map<Symbol, Expression>
    boundaryConditions?: BoundaryConditions
    constant?: Symbol
  }
): ODESolution | null {
  const x = options?.constant || new Symbol('C')
  const initialConditions = options?.initialConditions
  const boundaryConditions = options?.boundaryConditions

  let generalSolution: Expression | null = null
  let method = ''

  if (equation.type === 'add') {
    const add = equation as Add
    const terms = add.args

    if (terms.length === 2) {
      const separableSol = solveSeparable(equation, y, x)
      if (separableSol !== null) {
        generalSolution = separableSol.general
        method = separableSol.method
      }

      const bernoulliSol = solveBernoulli(equation, y, x)
      if (bernoulliSol !== null) {
        generalSolution = bernoulliSol.general
        method = bernoulliSol.method
      }

      const riccatiSol = solveRiccati(equation, y, x)
      if (riccatiSol !== null) {
        generalSolution = riccatiSol.general
        method = riccatiSol.method
      }

      const linearSol = solveLinearFirstOrder(equation, y, x)
      if (linearSol !== null) {
        generalSolution = linearSol.general
        method = linearSol.method
      }

      const constCoeffSol = solveConstCoeffLinear(equation, y, x)
      if (constCoeffSol !== null) {
        generalSolution = constCoeffSol.general
        method = constCoeffSol.method
      }
    }
  }

  if (equation.type === 'mul') {
    const separableSol = solveSeparableMul(equation as Mul, y, x)
    if (separableSol !== null) {
      generalSolution = separableSol.general
      method = separableSol.method
    }
  }

  if (generalSolution === null) return null

  if (initialConditions && initialConditions.size > 0) {
    const particularSolution = applyInitialConditions(generalSolution, y, x, initialConditions)
    if (particularSolution !== null) {
      return {
        general: generalSolution,
        particular: particularSolution,
        method: method + '_with_ivp'
      }
    }
  }

  if (boundaryConditions && boundaryConditions.y0 !== undefined) {
    const bcSolution = applyBoundaryConditions(generalSolution, y, x, boundaryConditions)
    if (bcSolution !== null) {
      return {
        general: generalSolution,
        particular: bcSolution,
        method: method + '_with_bc'
      }
    }
  }

  return {
    general: generalSolution,
    method
  }
}

function applyInitialConditions(
  generalSolution: Expression,
  y: Symbol,
  x: Symbol,
  initialConditions: Map<Symbol, Expression>
): Expression | null {
  const x0 = initialConditions.get(x)
  const y0 = initialConditions.get(y)

  if (x0 === undefined || y0 === undefined) return null

  return substituteConstant(generalSolution, y0)
}

function substituteConstant(expr: Expression, value: Expression): Expression {
  if (expr.type === 'symbol' && (expr as Symbol).name === 'C') {
    return value
  }

  if (expr.type === 'mul') {
    const mul = expr as Mul
    const newArgs = mul.args.map(arg => substituteConstant(arg, value))
    return new Mul(...newArgs)
  }

  if (expr.type === 'add') {
    const add = expr as Add
    const newArgs = add.args.map(arg => substituteConstant(arg, value))
    return new Add(...newArgs)
  }

  if (expr.type === 'pow') {
    const p = expr as Pow
    return new Pow(substituteConstant(p.base, value), substituteConstant(p.exp, value))
  }

  if (expr.type === 'div') {
    const d = expr as Div
    return new Div(substituteConstant(d.numerator, value), substituteConstant(d.denominator, value))
  }

  if (expr.type === 'neg') {
    const neg = expr as Neg
    return createNeg(substituteConstant(neg.arg, value))
  }

  return expr
}

function applyBoundaryConditions(
  generalSolution: Expression,
  _y: Symbol,
  _x: Symbol,
  bc: BoundaryConditions
): Expression | null {
  const x0 = bc.x0
  const y0 = bc.y0

  if (x0.type === 'integer' && y0.type === 'integer') {
    if (bc.x1 !== undefined && bc.y1 !== undefined) {
      return solveTwoPointBC(generalSolution)
    }
    return substituteConstant(generalSolution, y0)
  }

  return null
}

function solveTwoPointBC(
  generalSolution: Expression
): Expression | null {
  if (generalSolution.type !== 'add') return null

  const add = generalSolution as Add
  const terms = add.args

  let c1Term: Expression | null = null
  let c2Term: Expression | null = null
  let otherTerms: Expression[] = []

  for (const term of terms) {
    if (term.type === 'mul') {
      const mul = term as Mul
      const hasC1 = mul.args.some(arg => arg.type === 'symbol' && (arg as Symbol).name === 'C1')
      const hasC2 = mul.args.some(arg => arg.type === 'symbol' && (arg as Symbol).name === 'C2')
      if (hasC1 && !c1Term) {
        c1Term = term
      } else if (hasC2 && !c2Term) {
        c2Term = term
      } else if (!hasC1 && !hasC2) {
        otherTerms.push(term)
      }
    } else if (term.type === 'symbol') {
      const s = term as Symbol
      if (s.name === 'C1' && !c1Term) {
        c1Term = term
      } else if (s.name === 'C2' && !c2Term) {
        c2Term = term
      } else {
        otherTerms.push(term)
      }
    } else {
      otherTerms.push(term)
    }
  }

  if (c1Term === null || c2Term === null) return null

  return new Add(
    new Mul(new Symbol('C1'), c1Term),
    new Mul(new Symbol('C2'), c2Term),
    ...otherTerms
  )
}

function solveLinearFirstOrder(equation: Expression, y: Symbol, x: Symbol): ODESolution | null {
  if (equation.type !== 'add') return null

  const add = equation as Add
  const terms = add.args

  let dyTerm: Expression | null = null
  let yTerm: Expression | null = null
  let otherTerms: Expression[] = []

  for (const term of terms) {
    const containsY = containsSymbol(term, y)
    const containsDy = containsDifferential(term, y)

    if (containsDy && !containsY) {
      if (dyTerm === null) dyTerm = term
    } else if (containsY && !containsDy) {
      if (yTerm === null) yTerm = term
    } else {
      otherTerms.push(term)
    }
  }

  if (dyTerm === null || yTerm === null) return null

  const pCoeff = extractCoeffOf(yTerm, y)
  const qExpr = otherTerms.length > 0
    ? (otherTerms.length === 1 ? otherTerms[0] : new Add(...otherTerms))
    : Zero

  if (qExpr.type === 'mul') {
    const qTerms = (qExpr as Mul).args.filter(t => !containsSymbol(t, y))
    if (qTerms.length > 0) {
      otherTerms = qTerms
    }
  }

  const q = otherTerms.length > 0
    ? (otherTerms.length === 1 ? otherTerms[0] : new Add(...otherTerms))
    : Zero

  const result = solveLinearODE(pCoeff, q, y, x)

  return {
    general: result,
    method: 'linear_first_order'
  }
}

function solveLinearODE(P: bigint, Q: Expression, _y: Symbol, x: Symbol): Expression {
  const p = new Integer(P)
  const intFactor = new Exp(new Mul(p, x))

  const qInt = integrate(new Mul(Q, intFactor), x)
  const yInt = createNeg(qInt)

  const c = new Symbol('C')

  return new Add(
    new Mul(c, new Exp(createNeg(new Mul(p, x)))),
    new Div(yInt, intFactor)
  )
}

function solveConstCoeffLinear(equation: Expression, y: Symbol, x: Symbol): ODESolution | null {
  if (equation.type !== 'add') return null

  const add = equation as Add
  const aTerms = add.args.filter(t => containsDifferentialOfOrder(t, y, 2))
  const bTerms = add.args.filter(t => containsDifferentialOfOrder(t, y, 1) && !containsDifferentialOfOrder(t, y, 2))
  const cTerms = add.args.filter(t => !containsDifferentialOfOrder(t, y, 1) && !containsDifferentialOfOrder(t, y, 2))

  if (aTerms.length === 0 && bTerms.length === 0) return null

  const a = aTerms.length > 0 ? extractCoeffOf(aTerms[0], y) : 0n
  const b = bTerms.length > 0 ? extractCoeffOf(bTerms[0], y) : 0n
  const c = cTerms.length > 0 ? extractCoeffOf(cTerms[0], y) : 0n

  if (a === 0n && b === 0n) return null

  if (a === 0n) {
    const r = createNeg(new Div(new Integer(b), new Integer(c)))
    const c1 = new Symbol('C1')
    const c2 = new Symbol('C2')
    return {
      general: new Add(new Mul(c1, new Exp(new Mul(r, x))), new Mul(c2, new Exp(new Neg(r)))),
      method: 'first_order_linear_homogeneous'
    }
  }

  const discriminant = b * b - 4n * a * c

  const c1 = new Symbol('C1')
  const c2 = new Symbol('C2')

  if (discriminant > 0n) {
    const sqrtD = sqrtBigint(discriminant)
    if (sqrtD === null) return null

    const r1 = (-b + sqrtD) / (2n * a)
    const r2 = (-b - sqrtD) / (2n * a)

    return {
      general: new Add(
        new Mul(c1, new Exp(new Mul(new Integer(r1), x))),
        new Mul(c2, new Exp(new Mul(new Integer(r2), x)))
      ),
      method: 'const_coeff_characteristic'
    }
  } else if (discriminant === 0n) {
    const r = -b / (2n * a)

    return {
      general: new Add(
        new Mul(c1, new Exp(new Mul(new Integer(r), x))),
        new Mul(c2, new Mul(x, new Exp(new Mul(new Integer(r), x))))
      ),
      method: 'const_coeff_double_root'
    }
  } else {
    const realPart = -b / (2n * a)
    const sqrtAbsD = sqrtBigint(-discriminant)
    if (sqrtAbsD === null) return null

    const imagPart = sqrtAbsD / (2n * a)

    const expReal = new Exp(new Mul(new Integer(realPart), x))

    return {
      general: new Mul(expReal, new Add(
        new Mul(c1, new Cos(new Mul(new Integer(imagPart), x))),
        new Mul(c2, new Sin(new Mul(new Integer(imagPart), x)))
      )),
      method: 'const_coeff_complex_roots'
    }
  }
}

function solveSeparable(equation: Expression, y: Symbol, x: Symbol): ODESolution | null {
  if (equation.type !== 'add') return null

  const add = equation as Add
  if (add.args.length !== 2) return null

  const [term1, term2] = add.args

  const fOfX = tryExtractFOfX(term1, y)
  const gOfY = tryExtractGOfY(term2, y)

  if (fOfX !== null && gOfY !== null) {
    const fInt = integrate(fOfX, x)
    const gInt = integrate(new Div(One, gOfY), y)

    const c = new Symbol('C')
    return {
      general: new Add(gInt, createNeg(fInt), c),
      method: 'separable'
    }
  }

  return null
}

function solveSeparableMul(mul: Mul, y: Symbol, x: Symbol): ODESolution | null {
  const args = mul.args

  if (args.length !== 2) return null

  const fOfX = tryExtractFOfXFromTerm(args[0], y)
  const gOfY = tryExtractGOfYFromTerm(args[1], y)

  if (fOfX !== null && gOfY !== null) {
    const fInt = integrate(fOfX, x)
    const gInt = integrate(new Div(One, gOfY), y)

    const c = new Symbol('C')
    return {
      general: new Add(gInt, createNeg(fInt), c),
      method: 'separable_mul'
    }
  }

  return null
}

function solveBernoulli(equation: Expression, y: Symbol, x: Symbol): ODESolution | null {
  if (equation.type !== 'add') return null

  const add = equation as Add
  const terms = add.args

  let dyTerm: Expression | null = null
  let yPowerTerm: Expression | null = null
  let otherTerms: Expression[] = []

  for (const term of terms) {
    const containsY = containsSymbol(term, y)
    const containsDy = containsDifferential(term, y)

    if (containsDy && containsY) {
      const yPower = extractYPower(term, y)
      if (yPower !== null && yPower !== 1n) {
        if (dyTerm === null && yPowerTerm === null) {
          dyTerm = term
        }
      }
    } else if (containsDy && !containsY) {
      if (dyTerm === null) dyTerm = term
    } else if (containsY && !containsDy) {
      if (yPowerTerm === null) yPowerTerm = term
    } else {
      otherTerms.push(term)
    }
  }

  if (dyTerm === null || yPowerTerm === null) return null

  const qExpr = otherTerms.length > 0
    ? (otherTerms.length === 1 ? otherTerms[0] : new Add(...otherTerms))
    : Zero

  if (qExpr.type !== 'integer' || (qExpr as Integer).value !== 0n) return null

  const pCoeff = extractCoeffOf(dyTerm, y)
  const n = extractYPower(dyTerm, y)

  if (n === null || n <= 0n) return null

  const u = new Symbol('u')
  const uExpression = new Pow(y, new Integer(n - 1n))

  const linearSol = solveLinearFirstOrderForU(
    new Add(
      new Mul(new Integer(pCoeff * (n - 1n)), new Pow(y, new Integer(n))),
      dyTerm
    ),
    u,
    x
  )

  if (linearSol === null) return null

  return {
    general: new Pow(uExpression, new Div(One, new Integer(n - 1n))),
    method: 'bernoulli'
  }
}

function solveRiccati(equation: Expression, y: Symbol, x: Symbol): ODESolution | null {
  if (equation.type !== 'add') return null

  const add = equation as Add
  const terms = add.args

  let dyTerm: Expression | null = null
  let y2Term: Expression | null = null
  let yTerm: Expression | null = null

  for (const term of terms) {
    const containsY = containsSymbol(term, y)
    const containsDy = containsDifferential(term, y)

    if (containsDy && !containsY && !containsYPower(term, y, 2n)) {
      if (dyTerm === null) dyTerm = term
    } else if (containsDy && containsY) {
      const power = extractYPower(term, y)
      if (power === 2n) {
        if (y2Term === null) y2Term = term
      } else if (power === 1n) {
        if (yTerm === null) yTerm = term
      }
    }
  }

  if (dyTerm === null || y2Term === null) return null

  const aCoeff = extractCoeffOf(y2Term, y)
  const bCoeff = yTerm !== null ? extractCoeffOf(yTerm, y) : 0n

  if (aCoeff === 0n) return null

  const k = new Symbol('K')

  return {
    general: new Mul(new Div(createNeg(new Integer(bCoeff)), new Integer(aCoeff)), new Pow(new Add(x, k), new Integer(-1))),
    method: 'riccati_quadratic'
  }
}

function containsYPower(term: Expression, y: Symbol, power: bigint): boolean {
  if (term.type === 'pow') {
    const p = term as Pow
    if (p.base.equals(y) && p.exp.type === 'integer') {
      const expVal = (p.exp as Integer).value
      return expVal === power
    }
  }
  return false
}

function solveLinearFirstOrderForU(equation: Expression, u: Symbol, x: Symbol): ODESolution | null {
  if (equation.type !== 'add') return null

  const add = equation as Add
  const terms = add.args

  let duTerm: Expression | null = null
  let uTerm: Expression | null = null
  let otherTerms: Expression[] = []

  for (const term of terms) {
    const containsU = containsSymbol(term, u)
    const containsDu = containsDifferential(term, u)

    if (containsDu && !containsU) {
      if (duTerm === null) duTerm = term
    } else if (containsU && !containsDu) {
      if (uTerm === null) uTerm = term
    } else {
      otherTerms.push(term)
    }
  }

  if (duTerm === null || uTerm === null) return null

  const pCoeff = extractCoeffOf(uTerm, u)
  const qExpr = otherTerms.length > 0
    ? (otherTerms.length === 1 ? otherTerms[0] : new Add(...otherTerms))
    : Zero

  const p = new Integer(pCoeff)
  const intFactor = new Exp(new Mul(p, x))

  const qInt = integrate(new Mul(qExpr, intFactor), x)
  const uInt = createNeg(qInt)

  const c = new Symbol('C')

  return {
    general: new Add(
      new Mul(c, new Exp(createNeg(new Mul(p, x)))),
      new Div(uInt, intFactor)
    ),
    method: 'linear_for_bernoulli'
  }
}

function tryExtractFOfX(term: Expression, y: Symbol): Expression | null {
  if (!containsSymbol(term, y)) {
    return term
  }
  return null
}

function tryExtractGOfY(term: Expression, y: Symbol): Expression | null {
  if (!containsSymbol(term, y)) {
    return createNeg(term)
  }
  if (term.type === 'neg') {
    return (term as Neg).arg
  }
  return null
}

function tryExtractFOfXFromTerm(term: Expression, y: Symbol): Expression | null {
  if (!containsSymbol(term, y)) {
    return term
  }
  return null
}

function tryExtractGOfYFromTerm(term: Expression, y: Symbol): Expression | null {
  if (!containsSymbol(term, y)) {
    return createNeg(term)
  }
  if (term.type === 'neg') {
    return (term as Neg).arg
  }
  return null
}

function extractYPower(expr: Expression, y: Symbol): bigint | null {
  if (expr.type === 'mul') {
    const mul = expr as Mul
    for (const arg of mul.args) {
      if (arg.type === 'symbol' && (arg as Symbol).name === y.name) {
        return 1n
      }
      if (arg.type === 'pow') {
        const p = arg as Pow
        if (p.base.type === 'symbol' && (p.base as Symbol).name === y.name) {
          if (p.exp.type === 'integer') {
            return (p.exp as Integer).value
          }
        }
      }
    }
  }
  if (expr.type === 'symbol') {
    return 1n
  }
  if (expr.type === 'pow' && (expr as Pow).base.type === 'symbol') {
    const p = expr as Pow
    if ((p.base as Symbol).name === y.name && p.exp.type === 'integer') {
      return (p.exp as Integer).value
    }
  }
  return null
}

function containsSymbol(expr: Expression, sym: Symbol): boolean {
  if (expr.type === 'symbol') {
    return (expr as Symbol).name === sym.name
  }
  if (expr.type === 'integer') return false
  if (expr.type === 'mul') {
    return (expr as Mul).args.some(a => containsSymbol(a, sym))
  }
  if (expr.type === 'add') {
    return (expr as Add).args.some(a => containsSymbol(a, sym))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return containsSymbol(p.base, sym) || containsSymbol(p.exp, sym)
  }
  if (expr.type === 'neg') {
    return containsSymbol((expr as Neg).arg, sym)
  }
  return false
}

function containsDifferential(expr: Expression, y: Symbol): boolean {
  if (expr.type === 'mul') {
    return (expr as Mul).args.some(a => containsDifferential(a, y))
  }
  if (expr.type === 'add') {
    return (expr as Add).args.some(a => containsDifferential(a, y))
  }
  if (expr.type === 'neg') {
    return containsDifferential((expr as Neg).arg, y)
  }
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    return s.name === y.name
  }
  return false
}

function containsDifferentialOfOrder(expr: Expression, y: Symbol, order: number): boolean {
  if (order === 1) return containsDifferential(expr, y)
  if (expr.type === 'mul') {
    return (expr as Mul).args.some(a => containsDifferentialOfOrder(a, y, order))
  }
  if (expr.type === 'add') {
    return (expr as Add).args.some(a => containsDifferentialOfOrder(a, y, order))
  }
  if (expr.type === 'neg') {
    return containsDifferentialOfOrder((expr as Neg).arg, y, order)
  }
  if (expr.type === 'pow') {
    return containsDifferentialOfOrder((expr as Pow).base, y, order)
  }
  return false
}

function extractCoeffOf(expr: Expression, y: Symbol): bigint {
  if (expr.type === 'integer') {
    return (expr as Integer).value
  }
  if (expr.type === 'mul') {
    const mul = expr as Mul
    let coeff = 1n
    for (const arg of mul.args) {
      if (!containsSymbol(arg, y)) {
        if (arg.type === 'integer') {
          coeff *= (arg as Integer).value
        }
      }
    }
    return coeff
  }
  if (containsSymbol(expr, y)) {
    return 1n
  }
  return 0n
}

function sqrtBigint(n: bigint): bigint | null {
  if (n < 0n) return null
  if (n === 0n) return 0n
  let low = 0n
  let high = n
  while (low <= high) {
    const mid = (low + high) / 2n
    const sq = mid * mid
    if (sq === n) return mid
    if (sq < n) {
      low = mid + 1n
    } else {
      high = mid - 1n
    }
  }
  return null
}

export default dsolve