import { type Expression, Integer, Symbol, Add, Mul, Pow, Neg, Div, Zero, createNeg } from '../core/expr.js'

function factorial(n: number): bigint {
  if (n <= 1) return 1n
  let result = 1n
  for (let i = 2; i <= n; i++) {
    result *= BigInt(i)
  }
  return result
}

function seriesErf(x: Symbol, order: number): Expression {
  const sqrtPi = new Symbol('sqrt_pi')
  const coeff = new Div(new Integer(2), sqrtPi)

  const terms: Expression[] = []
  for (let n = 0; n <= order; n++) {
    const numerator = new Pow(x, new Integer(2 * n + 1))
    const denominator = new Mul(new Integer(Number(factorial(n))), new Integer(2 * n + 1))
    const sign = n % 2 === 1 ? createNeg(new Integer(1)) : new Integer(1)
    terms.push(new Mul(sign, coeff, new Div(numerator, denominator)))
  }

  if (terms.length === 0) return Zero

  let result = terms[0]
  for (let i = 1; i < terms.length; i++) {
    result = result.add(terms[i])
  }
  return result
}

export function series(
  expr: Expression,
  var_: Symbol,
  point: Expression = new Integer(0),
  order: number = 5
): Expression {
  if (expr.type === 'erf' && point.type === 'integer' && (point as Integer).value === 0n) {
    return seriesErf(var_, order)
  }

  if (expr.type === 'erfc' && point.type === 'integer' && (point as Integer).value === 0n) {
    return new Add(new Integer(1), createNeg(seriesErf(var_, order)))
  }

  const terms: Expression[] = []

  for (let n = 0; n <= order; n++) {
    const deriv = nthDerivative(expr, var_, n)
    const substituted = substituteValue(deriv, var_, point)
    const coeff = substituted.div(new Integer(factorial(n)))
    const term = coeff.mul(new Pow(var_.sub(point), new Integer(n)))
    terms.push(term)
  }

  if (terms.length === 0) return expr

  let result = terms[0]
  for (let i = 1; i < terms.length; i++) {
    result = result.add(terms[i])
  }
  return result
}

function nthDerivative(expr: Expression, var_: Symbol, n: number): Expression {
  let result = expr
  for (let i = 0; i < n; i++) {
    result = diff(result, var_)
  }
  return result
}

function diff(expr: Expression, var_: Symbol): Expression {
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    return s.name === var_.name ? new Integer(1) : new Integer(0)
  }
  if (expr.type === 'integer') return new Integer(0)
  if (expr.type === 'add') {
    const add = expr as Add
    return new Add(...add.args.map(a => diff(a, var_)))
  }
  if (expr.type === 'mul') {
    const mul = expr as Mul
    const args = mul.args
    if (args.length === 2) {
      const [u, v] = args
      return new Add(
        new Mul(diff(u, var_), v),
        new Mul(u, diff(v, var_))
      )
    }
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    if (p.exp.type === 'integer' && p.base.type === 'symbol' && (p.base as Symbol).name === var_.name) {
      const n = (p.exp as Integer).value
      return new Mul(new Integer(n), new Pow(p.base, new Integer(n - 1n)))
    }
  }
  return new Integer(0)
}

function substituteValue(expr: Expression, var_: Symbol, value: Expression): Expression {
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    return s.name === var_.name ? value : expr
  }
  if (expr.type === 'integer') return expr
  if (expr.type === 'add') {
    return (expr as Add).args.reduce((acc, arg) => acc.add(arg), Zero)
  }
  if (expr.type === 'mul') {
    return (expr as Mul).args.reduce((acc, arg) => acc.mul(arg), new Integer(1))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    if (p.exp.type === 'integer' && p.base.type === 'symbol') {
      return new Pow(p.base, new Integer((p.exp as Integer).value))
    }
    return expr
  }
  if (expr.type === 'neg') {
    return (expr as Neg).negate()
  }
  return expr
}

export function taylor(
  expr: Expression,
  var_: Symbol,
  point: Expression,
  order: number
): Expression {
  return series(expr, var_, point, order)
}

export function maclaurin(expr: Expression, var_: Symbol, order: number): Expression {
  return series(expr, var_, new Integer(0), order)
}

export default { series, taylor, maclaurin }