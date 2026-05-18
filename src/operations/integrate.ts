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
import { Sin, Cos, Log } from '../functions/trig.js'

export function integrate(
  expr: Expression,
  varOrOptions: Symbol | { var?: Symbol; lower?: Expression; upper?: Expression }
): Expression {
  let var_: Symbol
  let lower: Expression | undefined
  let upper: Expression | undefined

  if (varOrOptions instanceof Symbol) {
    var_ = varOrOptions
  } else {
    var_ = varOrOptions.var || new Symbol('x')
    lower = varOrOptions.lower
    upper = varOrOptions.upper
  }

  const result = integrateExpr(expr, var_)

  if (lower !== undefined && upper !== undefined) {
    return evaluateDefiniteIntegral(result, var_, lower, upper)
  }

  return result
}

function integrateExpr(expr: Expression, var_: Symbol): Expression {
  if (expr.type === 'symbol') {
    const s = expr as Symbol
    if (s.name === var_.name) {
      return new Pow(s, new Integer(2)).div(new Integer(2))
    }
    return new Mul(s, expr)
  }

  if (expr.type === 'integer') {
    return new Mul(expr, var_)
  }

  if (expr.type === 'neg') {
    const neg = expr as Neg
    return createNeg(integrateExpr(neg.arg, var_))
  }

  if (expr.type === 'add') {
    const add = expr as Add
    return new Add(...add.args.map((a) => integrateExpr(a, var_)))
  }

  if (expr.type === 'mul') {
    return integrateMul(expr as Mul, var_)
  }

  if (expr.type === 'pow') {
    return integratePow(expr as Pow, var_)
  }

  if (expr.type === 'div') {
    const div = expr as Div
    const numInt = integrateExpr(div.numerator, var_)
    return new Mul(numInt, new Log(div.denominator))
  }

  if (expr.type === 'sin') {
    const arg = (expr as { arg: Expression }).arg
    return new Neg(new Cos(arg))
  }

  if (expr.type === 'cos') {
    const arg = (expr as { arg: Expression }).arg
    return new Sin(arg)
  }

  return expr
}

function integrateMul(mul: Mul, var_: Symbol): Expression {
  const args = mul.args

  const numFactors: Expression[] = []
  const varFactors: Expression[] = []

  for (const arg of args) {
    if (containsSymbol(arg, var_)) {
      varFactors.push(arg)
    } else {
      numFactors.push(arg)
    }
  }

  if (varFactors.length === 0) {
    return new Mul(...numFactors, var_)
  }

  if (varFactors.length === 1) {
    const num = numFactors.length > 0 ? (numFactors.length > 1 ? new Mul(...numFactors) : numFactors[0]) : One
    const intVar = integrateSingleTerm(varFactors[0], var_)
    return new Mul(num, intVar)
  }

  if (varFactors.length === 2) {
    const [f1, f2] = varFactors
    if (f1.type === 'symbol' && f2.type === 'pow') {
      const p = f2 as Pow
      if (p.exp.type === 'integer' && (p.exp as Integer).value === 2n && p.base.equals(f1)) {
        const num = numFactors.length > 0 ? numFactors[0] : One
        return new Mul(num, new Pow(f1, new Integer(3)).div(new Integer(3)))
      }
    }
    if (f2.type === 'symbol' && f1.type === 'pow') {
      const p = f1 as Pow
      if (p.exp.type === 'integer' && (p.exp as Integer).value === 2n && p.base.equals(f2)) {
        const num = numFactors.length > 0 ? numFactors[0] : One
        return new Mul(num, new Pow(f2, new Integer(3)).div(new Integer(3)))
      }
    }
  }

  const num = numFactors.length > 0 ? (numFactors.length > 1 ? new Mul(...numFactors) : numFactors[0]) : One
  return new Mul(num, ...varFactors)
}

function integrateSingleTerm(term: Expression, var_: Symbol): Expression {
  if (term.type === 'symbol') {
    return new Pow(term, new Integer(2)).div(new Integer(2))
  }

  if (term.type === 'pow') {
    return integratePow(term as Pow, var_)
  }

  return term
}

function integratePow(pow: Pow, var_: Symbol): Expression {
  const { base, exp } = pow

  if (!containsSymbol(base, var_)) {
    if (exp.type === 'integer') {
      const n = (exp as Integer).value
      return new Mul(base, new Pow(var_, new Integer(n + 1n)).div(new Integer(n + 1n)))
    }
  }

  if (base.type === 'symbol' && (base as Symbol).name === var_.name) {
    if (exp.type === 'integer') {
      const n = (exp as Integer).value
      if (n === -1n) {
        return new Log(var_)
      }
      return new Pow(base, new Integer(n + 1n)).div(new Integer(n + 1n))
    }
  }

  return new Pow(base, exp)
}

function containsSymbol(expr: Expression, var_: Symbol): boolean {
  if (expr.type === 'symbol') {
    return (expr as Symbol).name === var_.name
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return containsSymbol(p.base, var_) || containsSymbol(p.exp, var_)
  }
  if (expr.type === 'mul') {
    return (expr as Mul).args.some((a) => containsSymbol(a, var_))
  }
  if (expr.type === 'add') {
    return (expr as Add).args.some((a) => containsSymbol(a, var_))
  }
  return false
}

function evaluateDefiniteIntegral(
  antiderivative: Expression,
  var_: Symbol,
  lower: Expression,
  upper: Expression
): Expression {
  const upperVal = substitute(antiderivative, var_, upper)
  const lowerVal = substitute(antiderivative, var_, lower)
  return createAdd(upperVal, createNeg(lowerVal))
}

function substitute(expr: Expression, var_: Symbol, value: Expression): Expression {
  if (expr.type === 'symbol') {
    return (expr as Symbol).name === var_.name ? value : expr
  }
  if (expr.type === 'integer') return expr
  if (expr.type === 'add') {
    return new Add(...(expr as Add).args.map((a) => substitute(a, var_, value)))
  }
  if (expr.type === 'mul') {
    return new Mul(...(expr as Mul).args.map((a) => substitute(a, var_, value)))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return new Pow(substitute(p.base, var_, value), substitute(p.exp, var_, value))
  }
  if (expr.type === 'neg') {
    return createNeg(substitute((expr as Neg).arg, var_, value))
  }
  if (expr.type === 'div') {
    const d = expr as Div
    return new Div(substitute(d.numerator, var_, value), substitute(d.denominator, var_, value))
  }
  return expr
}

export default integrate