import { type Expression, Integer, Symbol, Add, Mul, Pow, Neg } from '../core/expr.js'

export function summation(
  expr: Expression,
  varSpec: [Symbol, Expression, Expression]
): Expression | null {
  const [k, lower, upper] = varSpec

  if (lower.type !== 'integer' || upper.type !== 'integer') {
    return null
  }

  const l = Number((lower as Integer).value)
  const u = Number((upper as Integer).value)

  if (l > u) return new Integer(0)
  if (l === u) return substitute(expr, k, lower)

  let result: Expression = new Integer(0)
  for (let i = l; i <= u; i++) {
    const substituted = substitute(expr, k, new Integer(i))
    result = new Add(result, substituted)
  }
  return result
}

function substitute(expr: Expression, var_: Symbol, value: Expression): Expression {
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    return s.name === var_.name ? value : expr
  }
  if (expr.type === 'integer') return expr
  if (expr.type === 'add') {
    return new Add(...(expr as Add).args.map(a => substitute(a, var_, value)))
  }
  if (expr.type === 'mul') {
    return new Mul(...(expr as Mul).args.map(a => substitute(a, var_, value)))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return new Pow(substitute(p.base, var_, value), substitute(p.exp, var_, value))
  }
  if (expr.type === 'neg') {
    return new Neg(substitute((expr as Neg).arg, var_, value))
  }
  return expr
}

export default { summation }