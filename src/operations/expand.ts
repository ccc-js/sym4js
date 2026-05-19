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
} from '../core/expr.js'

const MAX_EXPAND_DEPTH = 100

let expandDepth = 0

export function expand(expr: Expression): Expression {
  expandDepth = 0
  return expandImpl(expr)
}

function expandImpl(expr: Expression): Expression {
  expandDepth++
  if (expandDepth > MAX_EXPAND_DEPTH) {
    return expr // Bail out to prevent stack overflow
  }

  try {
    if (expr.type === 'add') {
      return expandAdd(expr as Add)
    }
    if (expr.type === 'mul') {
      return expandMul(expr as Mul)
    }
    if (expr.type === 'pow') {
      return expandPow(expr as Pow)
    }
    if (expr.type === 'neg') {
      const neg = expr as Neg
      return createNeg(expandImpl(neg.arg))
    }
    if (expr.type === 'div') {
      const div = expr as Div
      const numExpanded = expandImpl(div.numerator)
      const denExpanded = expandImpl(div.denominator)
      if (denExpanded.type === 'add') {
        return expandFraction(numExpanded, denExpanded as Add)
      }
      return new Div(numExpanded, denExpanded)
    }
    return expr
  } finally {
    expandDepth--
  }
}

function expandAdd(expr: Add): Expression {
  const expandedArgs = expr.args.map((a) => expandImpl(a))
  const terms: Expression[] = []
  for (const arg of expandedArgs) {
    if (arg.type === 'add') {
      terms.push(...(arg as Add).args)
    } else {
      terms.push(arg)
    }
  }
  if (terms.length === 1) return terms[0]
  return new Add(...terms)
}

function expandMul(expr: Mul): Expression {
  const expandedArgs = expr.args.map((a) => expandImpl(a))

  const numTerms = new Map<string, { coeff: bigint; term: Expression }>()
  let totalCoeff = 1n

  for (const arg of expandedArgs) {
    if (arg.type === 'integer') {
      totalCoeff *= (arg as Integer).value
    } else if (arg.type === 'mul') {
      const mul = arg as Mul
      for (const f of mul.args) {
        if (f.type === 'integer') {
          totalCoeff *= (f as Integer).value
        } else {
          addFactor(f, 1n)
        }
      }
    } else {
      addFactor(arg, 1n)
    }
  }

  const result = buildMulResult(numTerms, totalCoeff)
  return result

  function addFactor(factor: Expression, mult: bigint): void {
    if (factor.type === 'pow' && (factor as Pow).exp.type === 'integer') {
      const p = factor as Pow
      const expVal = (p.exp as Integer).value
      if (expVal < 0n) return

      const base = expandImpl(p.base)

      if (base.type === 'add') {
        const expanded = expandPowToAdd(base as Add, Number(expVal))
        const terms = (expanded as Add).args
        for (const term of terms) {
          const [coeff, rest] = extractCoeff(term)
          addMulTerm(rest, coeff * mult)
        }
      } else {
        addMulTerm(new Pow(base, new Integer(expVal)), mult)
      }
    } else if (factor.type === 'add') {
      const expanded = expandMulOfAdd(factor as Add, mult)
      const terms = (expanded as Add).args
      for (const term of terms) {
        const [coeff, rest] = extractCoeff(term)
        addMulTerm(rest, coeff * mult)
      }
    } else {
      addMulTerm(factor, mult)
    }
  }

  function addMulTerm(term: Expression, coeff: bigint): void {
    if (isZero(term)) return
    if (coeff === 0n) return

    const [termCoeff, termRest] = extractCoeff(term)
    const key = getTermKey(termRest)
    const totalCoeff = termCoeff * coeff

    const existing = numTerms.get(key)
    if (existing) {
      const newCoeff = existing.coeff + totalCoeff
      if (newCoeff === 0n) {
        numTerms.delete(key)
      } else {
        numTerms.set(key, { coeff: newCoeff, term: existing.term })
      }
    } else {
      if (totalCoeff !== 0n) {
        numTerms.set(key, { coeff: totalCoeff, term: termRest })
      }
    }
  }
}

function expandMulOfAdd(add: Add, mult: bigint): Expression {
  const expanded = expandAddLiterals([add], Number(mult))
  return expanded
}

function buildMulResult(
  terms: Map<string, { coeff: bigint; term: Expression }>,
  totalCoeff: bigint
): Expression {
  const result: Expression[] = []

  if (totalCoeff !== 1n && totalCoeff !== 0n) {
    result.push(new Integer(totalCoeff))
  }

  for (const [, { coeff, term }] of terms) {
    if (isZero(term)) continue
    if (coeff === 0n) continue

    let termExpr: Expression
    if (term.type === 'symbol') {
      termExpr = term
    } else if (term.type === 'pow') {
      termExpr = term
    } else if (term.type === 'mul') {
      termExpr = term
    } else if (term.type === 'neg') {
      termExpr = term
    } else if (term.type === 'integer') {
      termExpr = term
    } else {
      termExpr = term
    }

    const finalCoeff = result.length > 0 ? coeff : totalCoeff * coeff

    if (finalCoeff === 1n) {
      result.push(termExpr)
    } else if (finalCoeff === -1n) {
      result.push(createNeg(termExpr))
    } else {
      result.push(new Integer(finalCoeff).mul(termExpr))
    }
  }

  if (result.length === 0) return One
  if (result.length === 1) return result[0]
  return new Mul(...result)
}

function expandPow(expr: Pow): Expression {
  const baseExpanded = expandImpl(expr.base)
  const expExpanded = expandImpl(expr.exp)

  if (expExpanded.type === 'integer') {
    const expVal = (expExpanded as Integer).value
    if (expVal === 0n) return One
    if (expVal === 1n) return baseExpanded
    if (expVal > 0n && expVal <= 10n) {
      if (baseExpanded.type === 'add') {
        return expandPowToAdd(baseExpanded as Add, Number(expVal))
      }
      const factors: Expression[] = []
      for (let i = 0n; i < expVal; i++) {
        factors.push(baseExpanded)
      }
      if (factors.length === 1) return factors[0]
      return new Mul(...factors)
    }
  }

  return new Pow(baseExpanded, expExpanded)
}

function expandPowToAdd(base: Add, exp: number): Expression {
  if (exp === 1) return base
  if (exp === 2) {
    return expandSquare(base)
  }
  const result = expandPowToAdd(base, exp - 1)
  return expandMulOfAdd(result as Add, 1n) as Add
}

function expandSquare(add: Add): Expression {
  const terms = add.args
  const n = terms.length

  if (n === 1) {
    return new Pow(terms[0], new Integer(2))
  }

  if (n === 2) {
    const [a, b] = terms
    const [aCoeff, aRest] = extractCoeff(a)
    const [bCoeff, bRest] = extractCoeff(b)

    const a2 = new Mul(new Integer(aCoeff * aCoeff), new Pow(aRest, new Integer(2)))
    const b2 = new Mul(new Integer(bCoeff * bCoeff), new Pow(bRest, new Integer(2)))
    const ab = new Mul(new Integer(BigInt(2) * aCoeff * bCoeff), aRest.mul(bRest))

    const result = new Add(a2, ab, b2)
    return result
  }

  const [first, ...rest] = terms
  const firstSquare = new Pow(first, new Integer(2))
  const restAdd = new Add(...rest)
  const restSquare = expandSquare(restAdd)
  const cross = new Mul(new Integer(2), first.mul(restAdd))

  return new Add(firstSquare, cross, restSquare)
}

function expandAddLiterals(adds: Add[], mult: number): Expression {
  if (adds.length === 0) return Zero
  if (adds.length === 1 && mult === 1) return adds[0]

  const termMap = new Map<string, bigint>()

  for (const add of adds) {
    const terms = add.args
    for (const term of terms) {
      const [coeff, rest] = extractCoeff(term)
      const key = getTermKey(rest)
      const existing = termMap.get(key) || 0n
      termMap.set(key, existing + coeff * BigInt(mult))
    }
  }

  const result: Expression[] = []
  for (const [key, coeff] of termMap) {
    if (coeff === 0n) continue
    const term = keyToTerm(key)
    if (coeff === 1n) {
      result.push(term)
    } else if (coeff === -1n) {
      result.push(createNeg(term))
    } else {
      result.push(new Integer(coeff).mul(term))
    }
  }

  if (result.length === 0) return Zero
  if (result.length === 1) return result[0]
  return new Add(...result)
}

function expandFraction(num: Expression, den: Add): Expression {
  const numTerms = extractAllTerms(num)

  // Check if expansion would cause cycle - if numerator has same structure as denominator
  const numStr = num.toString()
  const denStr = den.toString()
  if (numStr.includes(denStr) || denStr.includes(numStr)) {
    // Potential cycle - return simplified form without recursion
    return new Div(num, den)
  }

  const terms: Expression[] = []
  for (const nTerm of numTerms) {
    const [nCoeff, nRest] = extractCoeff(nTerm)
    terms.push(new Div(new Integer(nCoeff).mul(nRest), den))
  }

  if (terms.length === 0) return Zero
  if (terms.length === 1) return terms[0]
  return new Add(...terms)
}

function extractAllTerms(expr: Expression): Expression[] {
  if (expr.type === 'add') {
    return (expr as Add).args
  }
  return [expr]
}

function extractCoeff(expr: Expression): [bigint, Expression] {
  if (expr.type === 'mul') {
    const m = expr as Mul
    if (m.args.length >= 2 && m.args[0].type === 'integer') {
      return [(m.args[0] as Integer).value, new Mul(...m.args.slice(1))]
    }
  }
  if (expr.type === 'integer') {
    return [(expr as Integer).value, One]
  }
  if (expr.type === 'neg') {
    const neg = expr as Neg
    const [coeff, rest] = extractCoeff(neg.arg)
    return [-coeff, rest]
  }
  return [1n, expr]
}

function getTermKey(expr: Expression): string {
  if (expr.type === 'symbol') {
    return `s:${(expr as Symbol).name}`
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return `p:${getTermKey(p.base)}:${getTermKey(p.exp)}`
  }
  if (expr.type === 'mul') {
    const m = expr as Mul
    return m.args.map((a) => getTermKey(a)).join('*')
  }
  if (expr.type === 'neg') {
    return `n:${getTermKey((expr as Neg).arg)}`
  }
  if (expr.type === 'integer') {
    return `i:${(expr as Integer).value}`
  }
  return `u:${expr.toString()}`
}

function keyToTerm(key: string): Expression {
  if (key.startsWith('s:')) {
    return new Symbol(key.slice(2))
  }
  if (key.startsWith('i:')) {
    return new Integer(key.slice(2))
  }
  if (key.startsWith('n:')) {
    return createNeg(keyToTerm(key.slice(2)))
  }
  return new Symbol(key)
}

function createNeg(arg: Expression): Expression {
  if (arg.type === 'neg') return (arg as Neg).arg
  if (arg.type === 'integer') {
    return new Integer(-(arg as Integer).value)
  }
  return new Neg(arg)
}

export default expand