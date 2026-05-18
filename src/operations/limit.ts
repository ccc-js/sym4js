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
import { Sin, Cos, Log, Exp } from '../functions/trig.js'

export function limit(expr: Expression, var_: Symbol, point: Expression): Expression {
  const substituted = substituteAll(expr, var_, point)

  if (!containsFreeSymbols(substituted, var_)) {
    return simplifyExpr(substituted)
  }

  return tryLhopital(expr, var_, point)
}

function substituteAll(expr: Expression, var_: Symbol, point: Expression): Expression {
  if (expr.type === 'symbol') {
    return (expr as Symbol).name === var_.name ? point : expr
  }
  if (expr.type === 'integer') return expr
  if (expr.type === 'add') {
    return new Add(...(expr as Add).args.map((a) => substituteAll(a, var_, point)))
  }
  if (expr.type === 'mul') {
    return new Mul(...(expr as Mul).args.map((a) => substituteAll(a, var_, point)))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return new Pow(substituteAll(p.base, var_, point), substituteAll(p.exp, var_, point))
  }
  if (expr.type === 'neg') {
    return createNeg(substituteAll((expr as Neg).arg, var_, point))
  }
  if (expr.type === 'div') {
    const d = expr as Div
    return new Div(
      substituteAll(d.numerator, var_, point),
      substituteAll(d.denominator, var_, point)
    )
  }
  if (expr.type === 'sin') {
    const arg = (expr as { arg: Expression }).arg
    return new Sin(substituteAll(arg, var_, point))
  }
  if (expr.type === 'cos') {
    const arg = (expr as { arg: Expression }).arg
    return new Cos(substituteAll(arg, var_, point))
  }
  if (expr.type === 'log') {
    const arg = (expr as { arg: Expression }).arg
    return new Log(substituteAll(arg, var_, point))
  }
  if (expr.type === 'exp') {
    const arg = (expr as { arg: Expression }).arg
    return new Exp(substituteAll(arg, var_, point))
  }
  return expr
}

function containsFreeSymbols(expr: Expression, var_: Symbol): boolean {
  if (expr.type === 'symbol') {
    return (expr as Symbol).name === var_.name
  }
  if (expr.type === 'integer') return false
  if (expr.type === 'add') {
    return (expr as Add).args.some((a) => containsFreeSymbols(a, var_))
  }
  if (expr.type === 'mul') {
    return (expr as Mul).args.some((a) => containsFreeSymbols(a, var_))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return containsFreeSymbols(p.base, var_) || containsFreeSymbols(p.exp, var_)
  }
  if (expr.type === 'neg') {
    return containsFreeSymbols((expr as Neg).arg, var_)
  }
  if (expr.type === 'div') {
    const d = expr as Div
    return containsFreeSymbols(d.numerator, var_) || containsFreeSymbols(d.denominator, var_)
  }
  return false
}

function tryLhopital(expr: Expression, var_: Symbol, point: Expression): Expression {
  if (expr.type !== 'div') return expr

  const d = expr as Div
  const numHasVar = containsFreeSymbols(d.numerator, var_)
  const denHasVar = containsFreeSymbols(d.denominator, var_)

  if (!numHasVar || !denHasVar) return expr

  const numDeriv = diffSimple(d.numerator, var_)
  const denDeriv = diffSimple(d.denominator, var_)

  const newLimit = new Div(numDeriv, denDeriv)
  return limit(newLimit, var_, point)
}

function diffSimple(expr: Expression, var_: Symbol): Expression {
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    return s.name === var_.name ? One : Zero
  }
  if (expr.type === 'integer') return Zero
  if (expr.type === 'neg') {
    return createNeg(diffSimple((expr as Neg).arg, var_))
  }
  if (expr.type === 'add') {
    return new Add(...(expr as Add).args.map((a) => diffSimple(a, var_)))
  }
  if (expr.type === 'mul') {
    const mul = expr as Mul
    if (mul.args.length === 2) {
      const [u, v] = mul.args
      return createAdd(
        new Mul(diffSimple(u, var_), v),
        new Mul(u, diffSimple(v, var_))
      )
    }
    return Zero
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    if (p.exp.type === 'integer') {
      const n = (p.exp as Integer).value
      return new Mul(new Integer(n), new Pow(p.base, new Integer(n - 1n)))
    }
    return expr
  }
  if (expr.type === 'sin') {
    const arg = (expr as { arg: Expression }).arg
    return new Cos(arg)
  }
  if (expr.type === 'cos') {
    const arg = (expr as { arg: Expression }).arg
    return createNeg(new Sin(arg))
  }
  if (expr.type === 'exp') {
    const arg = (expr as { arg: Expression }).arg
    return new Exp(arg)
  }
  if (expr.type === 'log') {
    const arg = (expr as { arg: Expression }).arg
    return new Div(One, arg)
  }
  return Zero
}

function simplifyExpr(expr: Expression): Expression {
  if (expr.type === 'add') {
    const terms = (expr as Add).args
    let sum = 0n
    const nonNumeric: Expression[] = []

    for (const term of terms) {
      if (term.type === 'integer') {
        sum += (term as Integer).value
      } else if (term.type === 'neg') {
        const neg = term as Neg
        if (neg.arg.type === 'integer') {
          sum -= (neg.arg as Integer).value
        } else {
          nonNumeric.push(term)
        }
      } else {
        nonNumeric.push(term)
      }
    }

    if (nonNumeric.length === 0) return new Integer(sum)
    if (sum !== 0n) {
      nonNumeric.unshift(new Integer(sum))
    }
    if (nonNumeric.length === 1) return nonNumeric[0]
    return new Add(...nonNumeric)
  }

  if (expr.type === 'div') {
    const d = expr as Div
    if (d.numerator.type === 'integer' && d.denominator.type === 'integer') {
      const num = (d.numerator as Integer).value
      const den = (d.denominator as Integer).value
      if (den !== 0n && num % den === 0n) return new Integer(num / den)
    }
  }

  return expr
}

export default limit