import {
  type Expression,
  Integer,
  Symbol,
  Add,
  Mul,
  Pow,
  Neg,
  Zero,
  One,
  Two,
  createAdd,
  createNeg,
  asCoeffMul,
} from '../core/expr.js'

export function factor(expr: Expression): Expression {
  const expanded = expandExpr(expr)
  return factorImpl(expanded)
}

function expandExpr(expr: Expression): Expression {
  if (expr.type === 'add') {
    const add = expr as Add
    return new Add(...add.args.map(expandExpr))
  }
  if (expr.type === 'mul') {
    const mul = expr as Mul
    return new Mul(...mul.args.map(expandExpr))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return new Pow(expandExpr(p.base), expandExpr(p.exp))
  }
  if (expr.type === 'neg') {
    return createNeg(expandExpr((expr as Neg).arg))
  }
  return expr
}

function factorImpl(expr: Expression): Expression {
  if (expr.type === 'add') {
    return factorAdd(expr as Add)
  }
  if (expr.type === 'mul') {
    const mul = expr as Mul
    return new Mul(...mul.args.map(factorImpl))
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    if (p.exp.type === 'integer' && (p.exp as Integer).value === 2n) {
      return new Pow(factorImpl(p.base), Two)
    }
    return expr
  }
  if (expr.type === 'neg') {
    return createNeg(factorImpl((expr as Neg).arg))
  }
  return expr
}

function factorAdd(add: Add): Expression {
  const terms = add.args

  if (terms.length === 0) return Zero
  if (terms.length === 1) return factorImpl(terms[0])

  const commonGcd = findNumericGcd(terms)
  const commonFactors = findCommonFactors(terms)

  if (commonGcd !== 1n || commonFactors.length > 0) {
    const factoredTerms = extractCommonTerms(add, commonGcd, commonFactors)
    if (factoredTerms.length > 1) {
      return new Add(...factoredTerms)
    }
  }

  if (terms.length === 2) {
    const result = tryFactorQuadratic(terms[0], terms[1])
    if (result) return result
  }

  return add
}

function findNumericGcd(terms: Expression[]): bigint {
  let gcdVal = 0n
  for (const term of terms) {
    const [coeff] = asCoeffMul(term)
    if (coeff.type === 'integer') {
      const val = (coeff as Integer).value
      if (gcdVal === 0n) {
        gcdVal = val < 0n ? -val : val
      } else {
        gcdVal = gcd(gcdVal, val < 0n ? -val : val)
      }
    }
  }
  return gcdVal
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

function findCommonFactors(terms: Expression[]): Expression[] {
  if (terms.length < 2) return []

  const symbolCounts = new Map<string, number>()

  for (const term of terms) {
    const symbols = extractSymbols(term)
    for (const s of symbols) {
      const count = symbolCounts.get(s) || 0
      symbolCounts.set(s, count + 1)
    }
  }

  const common: Expression[] = []
  for (const [s, count] of symbolCounts) {
    if (count === terms.length && count > 1) {
      common.push(new Symbol(s))
    }
  }

  return common
}

function extractSymbols(expr: Expression): string[] {
  if (expr.type === 'symbol') {
    return [(expr as Symbol).name]
  }
  if (expr.type === 'mul') {
    const symbols: string[] = []
    for (const arg of (expr as Mul).args) {
      symbols.push(...extractSymbols(arg))
    }
    return symbols
  }
  if (expr.type === 'pow') {
    return extractSymbols((expr as Pow).base)
  }
  return []
}

function extractCommonTerms(
  add: Add,
  commonGcd: bigint,
  commonFactors: Expression[]
): Expression[] {
  const terms = add.args
  const result: Expression[] = []

  if (commonGcd !== 1n) {
    result.push(new Integer(commonGcd))
  }
  if (commonFactors.length > 0) {
    result.push(...commonFactors)
  }

  for (const term of terms) {
    let remaining = term
    for (const cf of commonFactors) {
      remaining = divideByFactor(remaining, cf)
    }
    if (!isZeroOrInteger(remaining)) {
      result.push(remaining)
    }
  }

  return result
}

function divideByFactor(expr: Expression, factor: Expression): Expression {
  if (expr.type === 'mul') {
    const mul = expr as Mul
    const newFactors = mul.args.filter((f) => !f.equals(factor))
    if (newFactors.length === 0) return One
    if (newFactors.length === 1) return newFactors[0]
    return new Mul(...newFactors)
  }
  return expr
}

function isZeroOrInteger(expr: Expression): boolean {
  if (expr.type === 'integer') return true
  if (expr.type === 'mul' && (expr as Mul).args.length === 0) return true
  return false
}

function tryFactorQuadratic(term1: Expression, term2: Expression): Expression | null {
  const [coeff1, rest1] = asCoeffMul(term1)
  const [coeff2, rest2] = asCoeffMul(term2)

  if (rest1.type !== 'pow' || rest2.type !== 'pow') return null

  const p1 = rest1 as Pow
  const p2 = rest2 as Pow

  if (!isOne(p1.exp) || !isOne(p2.exp)) return null

  const base1 = p1.base
  const base2 = p2.base

  if (!base1.equals(base2)) return null

  const x = base1
  const a = coeff1.type === 'integer' ? (coeff1 as Integer).value : 1n
  const c = coeff2.type === 'integer' ? (coeff2 as Integer).value : 1n

  if (a === 1n && c === -1n) {
    const factor1 = createAdd(x, One)
    const factor2 = createAdd(x, createNeg(One))
    return new Mul(factor1, factor2)
  }

  return null
}

function isOne(expr: Expression): boolean {
  return expr.type === 'integer' && (expr as Integer).value === 1n
}

export default factor