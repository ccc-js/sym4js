import { type Expression, Integer, Symbol, Add, Mul, Pow, Neg, Div } from '../core/expr.js'

export interface EvalOptions {
  precision?: number
  maxTerms?: number
}

export function evaluate(expr: Expression, vars: Map<Symbol, number>, options?: EvalOptions): number {
  const precision = options?.precision ?? 10
  const maxTerms = options?.maxTerms ?? 100

  return evalExpression(expr, vars, precision, maxTerms)
}

function evalExpression(expr: Expression, vars: Map<Symbol, number>, precision: number, maxTerms: number): number {
  switch (expr.type) {
    case 'integer':
      return Number((expr as Integer).value)

    case 'symbol': {
      const s = expr as Symbol
      const val = vars.get(s)
      if (val !== undefined) return val
      if (s.name === 'pi') return Math.PI
      if (s.name === 'e' || s.name === 'E') return Math.E
      if (s.name === 'sqrt_pi') return Math.sqrt(Math.PI)
      if (s.name === 'gamma_E') return 0.5772156649
      return NaN
    }

    case 'neg': {
      const neg = expr as Neg
      return -evalExpression(neg.arg, vars, precision, maxTerms)
    }

    case 'add': {
      const add = expr as Add
      return add.args.reduce((sum, arg) => sum + evalExpression(arg, vars, precision, maxTerms), 0)
    }

    case 'mul': {
      const mul = expr as Mul
      return mul.args.reduce((prod, arg) => prod * evalExpression(arg, vars, precision, maxTerms), 1)
    }

    case 'pow': {
      const p = expr as Pow
      const base = evalExpression(p.base, vars, precision, maxTerms)
      const exp = evalExpression(p.exp, vars, precision, maxTerms)
      return Math.pow(base, exp)
    }

    case 'div': {
      const d = expr as Div
      const num = evalExpression(d.numerator, vars, precision, maxTerms)
      const den = evalExpression(d.denominator, vars, precision, maxTerms)
      return den === 0 ? (num >= 0 ? Infinity : -Infinity) : num / den
    }

    case 'sin':
      return Math.sin(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'cos':
      return Math.cos(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'tan':
      return Math.tan(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'cot':
      return 1 / Math.tan(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'sec':
      return 1 / Math.cos(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'csc':
      return 1 / Math.sin(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'sinh':
      return Math.sinh(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'cosh':
      return Math.cosh(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'tanh':
      return Math.tanh(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'exp':
      return Math.exp(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'log':
      return Math.log(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'sqrt':
      return Math.sqrt(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'abs':
      return Math.abs(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'erf':
      return erf(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'erfc':
      return erfc(evalExpression(expr.args[0], vars, precision, maxTerms))

    case 'gamma': {
      const x = evalExpression((expr as any).arg, vars, precision, maxTerms)
      return gamma(x)
    }

    case 'psi': {
      const x = evalExpression((expr as any).arg, vars, precision, maxTerms)
      return digamma(x)
    }

    case 'bessel': {
      const order = evalExpression((expr as any).order, vars, precision, maxTerms)
      const arg = evalExpression((expr as any).arg, vars, precision, maxTerms)
      return besselJ(order, arg)
    }

    case 'legendre': {
      const n = Number((expr as any).n)
      const x = evalExpression((expr as any).arg, vars, precision, maxTerms)
      return legendreP(n, x)
    }

    default:
      return NaN
  }
}

function erf(x: number): number {
  const t = 1 / (1 + 0.5 * Math.abs(x))
  const tau = t * Math.exp(-x * x - 1.26551223 +
    t * (1.00002368 +
    t * (0.37409196 +
    t * (0.09678418 +
    t * (-0.18628806 +
    t * (0.27886807 +
    t * (-1.13520398 +
    t * (1.48851587 +
    t * (-0.82215223 +
    t * 0.17087277)))))))))
  return x >= 0 ? 1 - tau : tau - 1
}

function erfc(x: number): number {
  return 1 - erf(x)
}

function gamma(x: number): number {
  if (x < 0.5) {
    return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x))
  }
  x -= 1
  const g = 7
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ]
  let p = c[0]
  for (let i = 1; i < g + 2; i++) {
    p += c[i] / (x + i)
  }
  const t = x + g + 0.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * p
}

function digamma(x: number): number {
  const Euler = 0.5772156649
  if (x <= 0) return NaN
  if (x < 1) {
    return digamma(1 - x) + Math.PI / Math.tan(Math.PI * x)
  }
  let sum = 0
  for (let n = 0; n < 10; n++) {
    sum += x / ((n + 1) * (n + x))
  }
  return Euler + sum - 1 / x
}

function besselJ(n: number, x: number): number {
  if (n === 0) return Math.cos(x)
  if (n === 1) return Math.sin(x) / x
  if (x === 0) return 0

  const m = Math.round(2 * (n + Math.ceil(5 * n / 8)))
  let j0 = Math.cos(x)
  let j1 = Math.sin(x) / x

  for (let k = m; k > 1; k--) {
    const jk = (2 * k) / x * j1 - j0
    j0 = j1
    j1 = jk
  }
  return j1
}

function legendreP(n: number, x: number): number {
  if (n === 0) return 1
  if (n === 1) return x

  let p0 = 1
  let p1 = x

  for (let k = 2; k <= n; k++) {
    const pk = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k
    p0 = p1
    p1 = pk
  }

  return p1
}

export default { evaluate }