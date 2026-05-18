import { type Expression, Integer, Symbol, Add, Mul, Pow, Neg } from '../core/expr.js'
import { diff } from '../operations/diff.js'

function factorial(n: number): bigint {
  if (n <= 1) return 1n
  let result = 1n
  for (let i = 2; i <= n; i++) {
    result *= BigInt(i)
  }
  return result
}

export function series(
  expr: Expression,
  var_: Symbol,
  point: Expression = new Integer(0),
  order: number = 5
): Expression {
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

function substituteValue(expr: Expression, var_: Symbol, value: Expression): Expression {
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    return s.name === var_.name ? value : expr
  }
  if (expr.type === 'integer') return expr
  if (expr.type === 'add') {
    return (expr as Add).args.reduce((acc, arg) => acc.add(arg), new Integer(0))
  }
  if (expr.type === 'mul') {
    return (expr as Mul).args.reduce((acc, arg) => acc.mul(arg), new Integer(1))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    if (p.exp.type === 'integer' && p.base.type === 'symbol') {
      return new Integer((p.exp as Integer).value ** (value as Integer).value)
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