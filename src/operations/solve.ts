import {
  type Expression,
  Integer,
  Symbol,
  Add,
  Mul,
  Pow,
  Neg,
  Div,
  Zero,
  One,
  createAdd,
  createNeg,
} from '../core/expr.js'
import { Exp } from '../functions/trig.js'

export function solve(equation: Expression, variable: Symbol): Expression[] {
  if (equation.type === 'add') {
    return solveAdd(equation as Add, variable)
  }

  if (equation.type === 'mul') {
    const solutions = solveMul(equation as Mul, variable)
    return solutions
  }

  if (equation.type === 'pow') {
    return solvePow(equation as Pow, variable)
  }

  if (equation.type === 'neg') {
    return solve((equation as Neg).arg, variable)
  }

  if (equation.type === 'div') {
    return solveFraction(equation as Div, variable)
  }

  if (equation.type === 'symbol') {
    const s = equation as Symbol
    if (s.name === variable.name) {
      return [Zero]
    }
  }

  return []
}

function solveAdd(add: Add, variable: Symbol): Expression[] {
  const terms = add.args
  let constantPart: Expression = Zero
  const variableTerms: Expression[] = []

  for (const term of terms) {
    if (containsVariable(term, variable)) {
      variableTerms.push(term)
    } else {
      constantPart = createAdd(constantPart, term)
    }
  }

  if (variableTerms.length === 0) return []

  const combined = variableTerms.length === 1
    ? variableTerms[0]
    : new Add(...variableTerms)

  const rhs = createNeg(constantPart)
  return divideByCoefficient(combined, variable, rhs)
}

function solveMul(mul: Mul, variable: Symbol): Expression[] {
  const factors = mul.args
  const solutions: Expression[] = []

  for (const factor of factors) {
    const factorSolutions = solve(factor, variable)
    solutions.push(...factorSolutions)
  }

  const unique: Expression[] = []
  for (const s of solutions) {
    if (!unique.some(u => u.equals(s))) {
      unique.push(s)
    }
  }
  return unique.filter(s => !isZero(s))
}

function solvePow(pow: Pow, variable: Symbol): Expression[] {
  const { base, exp } = pow

  if (!containsVariable(base, variable)) {
    return []
  }

  if (exp.type === 'integer') {
    const n = (exp as Integer).value
    if (n === 1n) {
      return solve(base, variable)
    }
    if (n === 2n) {
      return solveQuadratic(base, variable)
    }
  }

  return []
}

function solveFraction(div: Div, variable: Symbol): Expression[] {
  const { numerator, denominator } = div
  const numSolutions = solve(numerator, variable)
  const denSolutions = solve(denominator, variable)

  return numSolutions.filter(s =>
    !denSolutions.some(ds => ds.equals(s))
  )
}

function solveQuadratic(base: Expression, variable: Symbol): Expression[] {
  if (base.type === 'add') {
    const terms = (base as Add).args
    if (terms.length === 2) {
      const [t1, t2] = terms
      const coeff1 = extractCoefficient(t1, variable)
      const coeff2 = extractCoefficient(t2, variable)

      if (coeff1 !== null && coeff2 !== null) {
        const a = coeff1
        const b = coeff2

        const discriminant = b * b - 4n * a * 0n
        if (discriminant === 0n) {
          return [createNeg(new Div(new Integer(b), new Integer(2n * a)))]
        }

        if (discriminant > 0n) {
          const sqrtD = isqrt(discriminant)
          if (sqrtD !== null) {
            const root1 = new Div(
              createAdd(new Integer(-b), new Integer(sqrtD)),
              new Integer(2n * a)
            )
            const root2 = new Div(
              createAdd(new Integer(-b), createNeg(new Integer(sqrtD))),
              new Integer(2n * a)
            )
            return [root1, root2]
          }
        }
      }
    }
  }

  const coeffResult = extractLinearCoefficient(base, variable)
  if (coeffResult !== null) {
    const [coeff, rest] = coeffResult
    if (rest.type === 'integer' && (rest as Integer).value === 0n) {
      return [createNeg(new Div(rest, new Integer(coeff)))]
    }
  }

  return []
}

function containsVariable(expr: Expression, variable: Symbol): boolean {
  if (expr.type === 'symbol') {
    return (expr as Symbol).name === variable.name
  }
  if (expr.type === 'integer') return false
  if (expr.type === 'add') {
    return (expr as Add).args.some(a => containsVariable(a, variable))
  }
  if (expr.type === 'mul') {
    return (expr as Mul).args.some(a => containsVariable(a, variable))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return containsVariable(p.base, variable)
  }
  if (expr.type === 'neg') {
    return containsVariable((expr as Neg).arg, variable)
  }
  return false
}

function extractCoefficient(expr: Expression, variable: Symbol): bigint | null {
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    if (s.name === variable.name) return 1n
    return null
  }
  if (expr.type === 'integer') {
    return 0n
  }
  if (expr.type === 'neg') {
    const neg = expr as Neg
    const inner = extractCoefficient(neg.arg, variable)
    return inner !== null ? -inner : null
  }
  if (expr.type === 'mul') {
    const mul = expr as Mul
    let hasVar = false
    let coeff = 1n
    for (const arg of mul.args) {
      if (arg.type === 'integer') {
        coeff *= (arg as Integer).value
      } else if (containsVariable(arg, variable)) {
        hasVar = true
      }
    }
    return hasVar ? coeff : 0n
  }
  return null
}

function extractLinearCoefficient(expr: Expression, variable: Symbol): [coeff: bigint, rest: Expression] | null {
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    if (s.name === variable.name) return [1n, Zero]
    return null
  }
  if (expr.type === 'integer') {
    return [0n, expr]
  }
  if (expr.type === 'neg') {
    const neg = expr as Neg
    const inner = extractLinearCoefficient(neg.arg, variable)
    if (inner !== null) {
      return [-inner[0], createNeg(inner[1])]
    }
    return null
  }
  if (expr.type === 'mul') {
    const mul = expr as Mul
    let hasVar = false
    let numCoeff = 1n
    const otherFactors: Expression[] = []

    for (const arg of mul.args) {
      if (arg.type === 'integer') {
        numCoeff *= (arg as Integer).value
      } else if (containsVariable(arg, variable)) {
        hasVar = true
      } else {
        otherFactors.push(arg)
      }
    }

    if (!hasVar) return [0n, expr]

    const rest = otherFactors.length === 0
      ? One
      : otherFactors.length === 1
        ? otherFactors[0]
        : new Mul(...otherFactors)

    return [numCoeff, rest]
  }
  if (expr.type === 'add') {
    const add = expr as Add
    let totalCoeff = 0n
    let restExpr: Expression | null = null

    for (const arg of add.args) {
      const coeffResult = extractLinearCoefficient(arg, variable)
      if (coeffResult !== null) {
        totalCoeff += coeffResult[0]
        if (restExpr === null) {
          restExpr = coeffResult[1]
        } else {
          restExpr = createAdd(restExpr, coeffResult[1])
        }
      } else {
        if (restExpr === null) {
          restExpr = arg
        } else {
          restExpr = createAdd(restExpr, arg)
        }
      }
    }

    return restExpr !== null ? [totalCoeff, restExpr] : null
  }
  return null
}

function divideByCoefficient(expr: Expression, variable: Symbol, rhs: Expression): Expression[] {
  const coeffResult = extractLinearCoefficient(expr, variable)
  if (coeffResult === null) return []

  const [coeff, rest] = coeffResult
  if (coeff === 0n) return []

  if (rest.type === 'integer' && (rest as Integer).value === 0n) {
    return [new Div(rhs, new Integer(coeff))]
  }

  const divisor = rest.type === 'integer'
    ? new Integer(coeff)
    : new Mul(new Integer(coeff), rest)

  return [new Div(rhs, divisor)]
}

function isZero(expr: Expression): boolean {
  return expr.type === 'integer' && (expr as Integer).value === 0n
}

function isqrt(n: bigint): bigint | null {
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

export function solveLinearSystem(
  equations: Expression[],
  variables: Symbol[]
): Map<Symbol, Expression> | null {
  const n = equations.length
  if (n !== variables.length) return null

  const matrix: bigint[][] = []
  const constants: bigint[] = []

  for (let i = 0; i < n; i++) {
    const row: bigint[] = []
    for (let j = 0; j < n; j++) {
      const coeff = extractCoefficient(equations[i], variables[j])
      row.push(coeff ?? 0n)
    }
    const constTerm = extractConstant(equations[i], variables)
    constants.push(constTerm)
    matrix.push(row)
  }

  const result = gaussianElimination(matrix, constants)
  if (result === null) return null

  const solutionMap = new Map<Symbol, Expression>()
  for (let i = 0; i < n; i++) {
    solutionMap.set(variables[i], new Integer(result[i]))
  }
  return solutionMap
}

function extractConstant(expr: Expression, variables: Symbol[]): bigint {
  const varNames = new Set(variables.map(v => v.name))

  if (expr.type === 'integer') {
    return (expr as Integer).value
  }
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    if (varNames.has(s.name)) return 0n
    return 0n
  }
  if (expr.type === 'neg') {
    return -extractConstant((expr as Neg).arg, variables)
  }
  if (expr.type === 'add') {
    let sum = 0n
    for (const arg of (expr as Add).args) {
      sum += extractConstant(arg, variables)
    }
    return sum
  }
  if (expr.type === 'mul') {
    const mul = expr as Mul
    let hasVar = false
    let coeff = 1n
    for (const arg of mul.args) {
      if (arg.type === 'integer') {
        coeff *= (arg as Integer).value
      } else if (arg.type === 'symbol' && varNames.has((arg as Symbol).name)) {
        hasVar = true
      }
    }
    return hasVar ? 0n : coeff
  }
  return 0n
}

function gaussianElimination(matrix: bigint[][], constants: bigint[]): bigint[] | null {
  const n = matrix.length
  const augmented = matrix.map((row, i) => [...row, constants[i]])

  for (let i = 0; i < n; i++) {
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (augmented[k][i] > augmented[maxRow][i]) {
        maxRow = k
      }
    }

    if (augmented[maxRow][i] === 0n) return null

    ;[augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]

    const pivot = augmented[i][i]

    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i]
      if (factor === 0n) continue

      for (let j = i; j <= n; j++) {
        augmented[k][j] = augmented[k][j] * pivot - augmented[i][j] * factor
      }
    }
  }

  const solution = new Array<bigint>(n)
  for (let i = n - 1; i >= 0; i--) {
    let sum = augmented[i][n]
    for (let j = i + 1; j < n; j++) {
      sum -= augmented[i][j] * solution[j]
    }
    const pivot = augmented[i][i]
    if (pivot === 0n) return null
    solution[i] = sum / pivot
  }

  return solution
}

export function solveODE(y: Expression, x: Symbol): Expression | null {
  if (y.type === 'mul' && (y as Mul).args.length === 2) {
    const args = (y as Mul).args
    const factor = args[0]
    const yExpr = args[1]

    if (yExpr.type === 'symbol' && (yExpr as Symbol).name === x.name) {
      if (factor.type === 'integer') {
        const k = (factor as Integer).value
        if (k !== 0n) {
          const C = new Symbol('C')
          return new Mul(
            new Exp(new Mul(new Integer(k), x)),
            C
          )
        }
      }
    }
  }

  if (y.type === 'add') {
    const terms = (y as Add).args
    if (terms.length === 2) {
      const [term1, term2] = terms

      if (term1.type === 'mul') {
        const mulArgs = (term1 as Mul).args
        if (mulArgs.length === 2) {
          const [coef, varPart] = mulArgs
          if (varPart.type === 'symbol' && (varPart as Symbol).name === x.name) {
            if (coef.type === 'integer') {
              const k = (coef as Integer).value
              if (k !== 0n) {
                const C = new Symbol('C')
                return new Mul(
                  new Exp(new Mul(new Integer(k), x)),
                  C
                )
              }
            }
          }
        }
      }

      if (term1.type === 'symbol' && (term1 as Symbol).name === x.name) {
        if (term2.type === 'integer') {
          const c = (term2 as Integer).value
          if (c !== 0n) {
            const C = new Symbol('C')
            return new Mul(
              new Exp(new Mul(createNeg(new Integer(c)), x)),
              C
            )
          }
        }
      }
    }
  }

  return null
}

export default { solve, solveLinearSystem, solveODE }