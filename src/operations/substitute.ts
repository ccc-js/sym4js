import { type Expression, Symbol, Add, Mul, Pow, Neg, Div } from '../core/expr.js'
import { type Substitution } from '../core/types.js'

export function substitute(expr: Expression, sub: Substitution): Expression {
  return substituteOne(expr, sub.variable.name, sub.value as Expression)
}

function substituteOne(expr: Expression, varName: string, value: Expression): Expression {
  if (expr.type === 'symbol') {
    return (expr as Symbol).name === varName ? value : expr
  }
  if (expr.type === 'integer') {
    return expr
  }
  if (expr.type === 'neg') {
    const e = expr as Neg
    return new Neg(substituteOne(e.arg, varName, value))
  }
  if (expr.type === 'add') {
    const e = expr as Add
    return new Add(...e.args.map((a) => substituteOne(a, varName, value)))
  }
  if (expr.type === 'mul') {
    const e = expr as Mul
    return new Mul(...e.args.map((a) => substituteOne(a, varName, value)))
  }
  if (expr.type === 'pow') {
    const e = expr as Pow
    return new Pow(substituteOne(e.base, varName, value), substituteOne(e.exp, varName, value))
  }
  if (expr.type === 'div') {
    const e = expr as Div
    return new Div(
      substituteOne(e.numerator, varName, value),
      substituteOne(e.denominator, varName, value)
    )
  }
  return expr
}

export default substitute