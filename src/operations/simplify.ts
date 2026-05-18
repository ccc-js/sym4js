import {
  type Expression,
  Integer,
  Zero,
  One,
  Add,
  Mul,
  Pow,
  Neg,
  Div,
  isZero,
  isOne,
} from '../core/expr.js'

export function simplify(expr: Expression): Expression {
  const result = simplifyImpl(expr)
  if (result.equals(expr)) {
    return result
  }
  return simplify(result)
}

function simplifyImpl(expr: Expression): Expression {
  if (expr.type === 'neg') {
    const e = expr as Neg
    const simpArg = simplifyImpl(e.arg)
    if (simpArg.type === 'neg') {
      return (simpArg as Neg).arg
    }
    return new Neg(simpArg)
  }

  if (expr.type === 'add') {
    return simplifyAdd(expr as Add)
  }

  if (expr.type === 'mul') {
    return simplifyMul(expr as Mul)
  }

  if (expr.type === 'pow') {
    return simplifyPow(expr as Pow)
  }

  if (expr.type === 'div') {
    return simplifyDiv(expr as Div)
  }

  return expr
}

function simplifyAdd(expr: Add): Expression {
  const simpArgs = expr.args.map((a) => simplifyImpl(a))
  const filtered = simpArgs.filter((a) => !isZero(a))
  if (filtered.length === 0) return Zero
  if (filtered.length === 1) return filtered[0]
  return new Add(...filtered)
}

function simplifyMul(expr: Mul): Expression {
  const simpArgs = expr.args.map((a) => simplifyImpl(a))
  const filtered = simpArgs.filter((a) => !isOne(a))
  if (filtered.length === 0) return One
  if (filtered.some((a) => isZero(a))) return Zero
  if (filtered.length === 1) return filtered[0]
  return new Mul(...filtered)
}

function simplifyPow(expr: Pow): Expression {
  const simpBase = simplifyImpl(expr.base)
  const simpExp = simplifyImpl(expr.exp)

  if (simpExp.type === 'integer' && (simpExp as Integer).value === 0n) return One
  if (simpExp.type === 'integer' && (simpExp as Integer).value === 1n) return simpBase

  if (simpBase.type === 'integer' && simpExp.type === 'integer') {
    const base = simpBase as Integer
    const exp = Number((simpExp as Integer).value)
    if (exp >= 0 && exp <= 100) {
      let result = 1n
      for (let i = 0; i < exp; i++) {
        result *= base.value
      }
      return new Integer(result)
    }
  }

  if (simpBase.type === 'integer' && (simpBase as Integer).value === 0n) {
    if (simpExp.type === 'integer' && (simpExp as Integer).value < 0n) {
      throw new Error('Division by zero')
    }
    return Zero
  }

  return new Pow(simpBase, simpExp)
}

function simplifyDiv(expr: Div): Expression {
  const simpNum = simplifyImpl(expr.numerator)
  const simpDen = simplifyImpl(expr.denominator)

  if (simpDen.type === 'integer' && (simpDen as Integer).value === 1n) return simpNum
  if (isZero(simpNum)) return Zero

  if (simpNum.type === 'integer' && simpDen.type === 'integer') {
    const num = (simpNum as Integer).value
    const den = (simpDen as Integer).value
    if (den !== 0n && num % den === 0n) {
      return new Integer(num / den)
    }
    const gcdVal = gcd(num < 0n ? -num : num, den < 0n ? -den : den)
    if (gcdVal !== 0n) {
      const newNum = num / gcdVal
      const newDen = den / gcdVal
      if (newDen === 1n) return new Integer(newNum)
      if (newDen < 0n) {
        return new Div(new Integer(-newNum), new Integer(-newDen))
      }
      return new Div(new Integer(newNum), new Integer(newDen))
    }
  }

  if (simpNum.equals(simpDen)) return One

  return new Div(simpNum, simpDen)
}

function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  while (b !== 0n) {
    const temp = b
    b = a % b
    a = temp
  }
  return a
}

export default simplify