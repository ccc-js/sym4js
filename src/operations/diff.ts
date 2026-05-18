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
  isZero,
  createAdd,
  createNeg,
} from '../core/expr.js'
import { Sin, Cos, Tan, Log } from '../functions/trig.js'

export function diff(expr: Expression, var_: Symbol, order: number = 1): Expression {
  if (order === 0) return expr
  if (order < 0) throw new Error('Order must be non-negative')

  let result = expr
  for (let i = 0; i < order; i++) {
    result = diffOnce(result, var_)
  }
  return result
}

function diffOnce(expr: Expression, var_: Symbol): Expression {
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    return s.name === var_.name ? One : Zero
  }

  if (expr.type === 'integer') {
    return Zero
  }

  if (expr.type === 'neg') {
    const neg = expr as Neg
    return createNeg(diffOnce(neg.arg, var_))
  }

  if (expr.type === 'add') {
    const add = expr as Add
    const terms = add.args.map((a) => diffOnce(a, var_))
    if (terms.every((t) => isZero(t))) return Zero
    return new Add(...terms.filter((t) => !isZero(t)))
  }

  if (expr.type === 'mul') {
    const mul = expr as Mul
    const args = mul.args

    if (args.length === 2) {
      const [u, v] = args
      return createAdd(
        new Mul(diffOnce(u, var_), v),
        new Mul(u, diffOnce(v, var_))
      )
    }

    if (args.length > 2) {
      const terms: Expression[] = []
      for (let i = 0; i < args.length; i++) {
        const derivative = diffOnce(args[i], var_)
        if (!isZero(derivative)) {
          const factors = [...args]
          factors[i] = derivative
          terms.push(new Mul(...factors))
        }
      }
      if (terms.length === 0) return Zero
      if (terms.length === 1) return terms[0]
      return new Add(...terms)
    }

    const [u] = args
    return new Mul(diffOnce(u, var_), u)
  }

  if (expr.type === 'pow') {
    const p = expr as Pow
    const { base, exp } = p

    const baseDeriv = diffOnce(base, var_)
    const expDeriv = diffOnce(exp, var_)

    if (isZero(expDeriv)) {
      if (isZero(baseDeriv)) {
        return Zero
      }
      if (exp.type === 'integer') {
        const n = (exp as Integer).value
        return new Mul(
          new Mul(new Integer(n), new Pow(base, new Integer(n - 1n))),
          baseDeriv
        )
      }
      return new Mul(
        new Mul(exp, new Pow(base, new Add(exp, new Integer(-1n)))),
        baseDeriv
      )
    }

    if (isZero(baseDeriv)) {
      if (exp.type === 'symbol' && (exp as Symbol).name === var_.name) {
        return new Mul(expr, new Log(base))
      }
      return Zero
    }

    return new Mul(
      expr,
      createAdd(
        new Mul(expDeriv, new Log(base)),
        new Mul(
          new Mul(exp, new Pow(base, new Integer(-1n))),
          baseDeriv
        )
      )
    )
  }

  if (expr.type === 'div') {
    const div = expr as Div
    const { numerator, denominator } = div
    const u = numerator
    const v = denominator

    return new Div(
      createAdd(
        new Mul(diffOnce(u, var_), v),
        createNeg(new Mul(u, diffOnce(v, var_)))
      ),
      new Pow(v, new Integer(2))
    )
  }

  if (expr.type === 'sin') {
    const arg = (expr as Sin).arg
    return new Cos(arg).mul(diffOnce(arg, var_))
  }

  if (expr.type === 'cos') {
    const arg = (expr as Cos).arg
    return createNeg(new Sin(arg)).mul(diffOnce(arg, var_))
  }

  if (expr.type === 'tan') {
    const arg = (expr as Tan).arg
    const sec2 = createAdd(One, new Pow(new Tan(arg), new Integer(2)))
    return new Mul(sec2, diffOnce(arg, var_))
  }

  return expr
}

export default diff