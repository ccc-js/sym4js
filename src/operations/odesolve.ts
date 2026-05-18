import { type Expression, Integer, Symbol, Add, Mul, Pow, Neg, Div, Zero, createNeg } from '../core/expr.js'
import { integrate } from './integrate.js'
import { Exp, Sin, Cos } from '../functions/trig.js'

export interface ODESolution {
  general: Expression
  particular?: Expression
  method: string
}

export function dsolve(equation: Expression, y: Symbol, options?: { initialConditions?: Map<Symbol, Expression>; constant?: Symbol }): ODESolution | null {
  const x = options?.constant || new Symbol('C')

  if (equation.type === 'add') {
    const add = equation as Add
    const terms = add.args

    if (terms.length === 2) {
      const linearSol = solveLinearFirstOrder(equation, y, x)
      if (linearSol !== null) return linearSol

      const constCoeffSol = solveConstCoeffLinear(equation, y, x)
      if (constCoeffSol !== null) return constCoeffSol
    }
  }

  return null
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