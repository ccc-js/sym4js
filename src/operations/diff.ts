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
import { Sin, Cos, Tan, Cot, Sec, Csc, Log, Exp, Sinh, Cosh, Tanh } from '../functions/trig.js'
import { Gamma, Bessel, Legendre } from '../functions/special.js'

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

  if (expr.type === 'cot') {
    const arg = (expr as Cot).arg
    const csc2 = createAdd(One, new Pow(new Cot(arg), new Integer(2)))
    return createNeg(new Mul(csc2, diffOnce(arg, var_)))
  }

  if (expr.type === 'sec') {
    const arg = (expr as Sec).arg
    return new Mul(new Sec(arg), new Tan(arg)).mul(diffOnce(arg, var_))
  }

  if (expr.type === 'csc') {
    const arg = (expr as Csc).arg
    return createNeg(new Mul(new Csc(arg), new Cot(arg))).mul(diffOnce(arg, var_))
  }

  if (expr.type === 'sinh') {
    const arg = (expr as Sinh).arg
    return new Cosh(arg).mul(diffOnce(arg, var_))
  }

  if (expr.type === 'cosh') {
    const arg = (expr as Cosh).arg
    return new Sinh(arg).mul(diffOnce(arg, var_))
  }

  if (expr.type === 'tanh') {
    const arg = (expr as Tanh).arg
    const sech2 = createNeg(new Pow(new Tanh(arg), new Integer(2))).add(One)
    return new Mul(sech2, diffOnce(arg, var_))
  }

  if (expr.type === 'exp') {
    const arg = (expr as Exp).arg
    return new Exp(arg).mul(diffOnce(arg, var_))
  }

  if (expr.type === 'log') {
    const arg = expr.args[0]
    return new Div(diffOnce(arg, var_), arg)
  }

  if (expr.type === 'gamma') {
    const gamma = expr as Gamma
    const gammaArg = gamma.arg
    const psiX = new Symbol(`Psi_${gammaArg.toString()}`)
    return new Mul(new Gamma(gammaArg), psiX, diffOnce(gammaArg, var_))
  }

  if (expr.type === 'bessel') {
    const bessel = expr as Bessel
    const n = bessel.order
    const x = bessel.arg

    if (n.type === 'integer') {
      const order = (n as Integer).value
      if (order > 0n) {
        const jNMinus1 = new Bessel(new Integer(order - 1n), x)
        const jN = new Bessel(n, x)
        const term = new Div(new Mul(new Integer(order), jN), x)
        return createAdd(new Mul(jNMinus1, diffOnce(x, var_)), createNeg(new Mul(term, diffOnce(x, var_))))
      }
    }
    return Zero
  }

  if (expr.type === 'legendre') {
    const legendre = expr as Legendre
    const n = legendre.n
    const x = legendre.arg

    if (n.type === 'integer') {
      const order = (n as Integer).value
      if (order > 0n) {
        const pNMinus1 = new Legendre(new Integer(order - 1n), x)
        const term1 = new Mul(new Integer(order), new Mul(x, pNMinus1))
        const pNMinus2 = new Legendre(new Integer(order - 2n), x)
        const term2 = new Mul(new Integer(order - 1n), pNMinus2)
        const numerator = createAdd(term1, createNeg(term2))
        const denominator = createNeg(new Pow(x, new Integer(2))).add(One)
        return new Div(new Mul(numerator, diffOnce(x, var_)), denominator)
      }
    }
    return Zero
  }

  return expr
}

export default diff