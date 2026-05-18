import { type Expression, Integer, Symbol, Add, Mul, Pow, Div, Neg, One } from '../core/expr.js'
import { Log } from '../functions/trig.js'
import { Poly } from '../polynomial/poly.js'

export function partialFractions(expr: Expression, var_: Symbol = new Symbol('x')): Expression | null {
  if (expr.type !== 'div') return null

  const div = expr as Div
  const numerator = div.numerator
  const denominator = div.denominator

  if (numerator.type !== 'add' && denominator.type !== 'add') {
    return trySimplePartialFractions(numerator, denominator, var_)
  }

  const numPoly = Poly.fromExpression(numerator, var_)
  const denPoly = Poly.fromExpression(denominator, var_)

  if (numPoly === null || denPoly === null) return null

  const numCoeffs = numPoly.coeffs
  const denCoeffs = denPoly.coeffs

  const numLeading = numCoeffs[numCoeffs.length - 1]
  const denLeading = denCoeffs[denCoeffs.length - 1]

  if (numLeading === denLeading) {
    return null
  }

  if (denCoeffs.length > numCoeffs.length) {
    return null
  }

  const { quotient, remainder } = numPoly.div(denPoly)

  if (remainder.isZero()) {
    return quotient.toExpression()
  }

  const factoredDen = factorDenominator(denPoly, var_)
  if (factoredDen === null) return null

  return buildPartialFractionsExpression(denPoly, var_)
}

function trySimplePartialFractions(_numerator: Expression, denominator: Expression, var_: Symbol): Expression | null {
  if (denominator.type === 'pow') {
    const p = denominator as Pow
    if (p.exp.type === 'integer' && (p.exp as Integer).value === 2n) {
      if (p.base.type === 'add') {
        const add = p.base as Add
        if (add.args.length === 2) {
          const roots = findLinearRoots(p.base, var_)
          if (roots.length === 2) {
            const [r1, r2] = roots
            if (r1 !== null && r2 !== null) {
              const r1Expr = new Integer(r1)
              const r2Expr = new Integer(r2)
              const coeff1 = new Div(One, new Add(new Neg(r1Expr), var_))
              const coeff2 = new Div(One, new Add(new Neg(r2Expr), var_))
              const half = new Div(new Integer(1), new Integer(2))
              return new Add(
                new Mul(half, coeff1),
                new Mul(half, coeff2)
              )
            }
          }
        }
      }
    }
  }

  return null
}

function findLinearRoots(expr: Expression, var_: Symbol): bigint[] {
  if (expr.type === 'add') {
    const add = expr as Add
    const roots: bigint[] = []

    for (const arg of add.args) {
      if (arg.type === 'mul') {
        const mul = arg as Mul
        let coef: bigint = 1n
        let hasVar = false
        for (const f of mul.args) {
          if (f.type === 'integer') {
            coef *= (f as Integer).value
          } else if (f.type === 'symbol' && (f as Symbol).name === var_.name) {
            hasVar = true
          } else if (f.type === 'pow' && (f as Pow).base.type === 'symbol' && ((f as Pow).base as Symbol).name === var_.name) {
            if ((f as Pow).exp.type === 'integer' && (f as Pow).exp.type === 'integer' && ((f as Pow).exp as Integer).value === 1n) {
              hasVar = true
            }
          }
        }
        if (hasVar) {
          const root = -coef
          roots.push(root)
        }
      } else if (arg.type === 'symbol') {
        roots.push(0n)
      }
    }

    return roots
  }

  if (expr.type === 'mul') {
    const mul = expr as Mul
    let coef: bigint = 1n
    let hasVar = false
    for (const f of mul.args) {
      if (f.type === 'integer') {
        coef *= (f as Integer).value
      } else if (f.type === 'symbol') {
        hasVar = true
      }
    }
    if (hasVar) {
      return [-coef]
    }
  }

  if (expr.type === 'symbol') {
    return [0n]
  }

  return []
}

function factorDenominator(poly: Poly, var_: Symbol): { factor: Poly; multiplicity: number }[] | null {
  const factors: { factor: Poly; multiplicity: number }[] = []

  const roots = poly.rationalRoots()
  if (roots === null) return null

  for (const root of roots) {
    if (root === null) continue
    const linearFactor = new Poly([-root, 1n], var_)
    let mult = 0
    let temp = poly.clone()
    let hasMore = true
    while (hasMore) {
      const { quotient, remainder } = temp.div(linearFactor)
      if (remainder.isZero()) {
        mult++
        temp = quotient
      } else {
        hasMore = false
      }
    }
    factors.push({ factor: linearFactor, multiplicity: mult })
  }

  const remainingDegree = poly.degree() - factors.reduce((sum, f) => sum + f.multiplicity, 0)
  if (remainingDegree > 0) {
    return null
  }

  return factors
}

function buildPartialFractionsExpression(denPoly: Poly, var_: Symbol): Expression | null {
  const factors = factorDenominator(denPoly, var_)
  if (factors === null) return null

  const terms: Expression[] = []
  for (const { factor, multiplicity } of factors) {
    const root = -factor.coeffs[0]
    for (let i = 0; i < multiplicity; i++) {
      const denominator = i === 0
        ? new Add(var_, new Neg(new Integer(root)))
        : new Pow(new Add(var_, new Neg(new Integer(root))), new Integer(i + 1))

      const numerator = new Symbol(`C_${root}_${i}`)
      terms.push(new Div(numerator, denominator))
    }
  }

  if (terms.length === 0) return null
  if (terms.length === 1) return terms[0]

  return new Add(...terms)
}

export function integrateRational(expr: Expression, var_: Symbol = new Symbol('x')): Expression | null {
  const pf = partialFractions(expr, var_)
  if (pf === null) return null

  if (pf.type === 'add') {
    const add = pf as Add
    let result: Expression | null = null
    for (const term of add.args) {
      const termInt = tryIntegrateTerm(term)
      if (termInt === null) return null
      result = result === null ? termInt : result.add(termInt)
    }
    return result
  }

  return tryIntegrateTerm(pf)
}

function tryIntegrateTerm(term: Expression): Expression | null {
  if (term.type !== 'div') return null

  const div = term as Div
  const numer = div.numerator
  const denom = div.denominator

  if (denom.type === 'add') {
    const add = denom as Add
    if (add.args.length === 2) {
      const hasVar = add.args.some(a =>
        a.type === 'symbol' || (a.type === 'mul' && a.args.some(f => f.type === 'symbol'))
      )

      if (hasVar) {
        const coef = numer.type === 'symbol' ? One : numer as Expression
        return new Div(new Log(denom), coef)
      }
    }
  }

  if (denom.type === 'pow' && denom.args[1].type === 'integer') {
    const p = denom as Pow
    const exp = p.exp as Integer

    if (exp.value === 1n) {
      return new Div(numer, denom)
    }

    if (exp.value === 2n) {
      const linearDen = p.base
      if (linearDen.type === 'add' && (linearDen as Add).args.length === 2) {
        return new Div(numer, new Neg(new Pow(linearDen, new Integer(-1))))
      }
    }
  }

  return null
}

export default { partialFractions, integrateRational }