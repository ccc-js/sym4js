import { Integer, Symbol, Expression, Add, Mul, Pow } from '../core/expr.js'

export class Poly {
  coeffs: bigint[]
  readonly variable: Symbol

  constructor(coeffs: (bigint | number)[], variable: Symbol = new Symbol('x')) {
    this.coeffs = coeffs.map(c => typeof c === 'bigint' ? c : BigInt(c))
    this.variable = variable
    this.normalize()
  }

  private normalize(): void {
    while (this.coeffs.length > 0 && this.coeffs[this.coeffs.length - 1] === 0n) {
      this.coeffs.pop()
    }
    if (this.coeffs.length === 0) {
      this.coeffs = [0n]
    }
  }

  degree(): number {
    return this.coeffs.length - 1
  }

  leadingCoeff(): bigint {
    return this.coeffs[this.coeffs.length - 1]
  }

  constant(): bigint {
    return this.coeffs[0]
  }

  add(other: Poly): Poly {
    const maxLen = Math.max(this.coeffs.length, other.coeffs.length)
    const result: bigint[] = []
    for (let i = 0; i < maxLen; i++) {
      const a = i < this.coeffs.length ? this.coeffs[i] : 0n
      const b = i < other.coeffs.length ? other.coeffs[i] : 0n
      result.push(a + b)
    }
    return new Poly(result, this.variable)
  }

  sub(other: Poly): Poly {
    const maxLen = Math.max(this.coeffs.length, other.coeffs.length)
    const result: bigint[] = []
    for (let i = 0; i < maxLen; i++) {
      const a = i < this.coeffs.length ? this.coeffs[i] : 0n
      const b = i < other.coeffs.length ? other.coeffs[i] : 0n
      result.push(a - b)
    }
    return new Poly(result, this.variable)
  }

  mul(other: Poly): Poly {
    if (this.isZero() || other.isZero()) {
      return new Poly([0n], this.variable)
    }
    const resultLen = this.coeffs.length + other.coeffs.length - 1
    const result: bigint[] = new Array(resultLen).fill(0n)
    for (let i = 0; i < this.coeffs.length; i++) {
      for (let j = 0; j < other.coeffs.length; j++) {
        result[i + j] += this.coeffs[i] * other.coeffs[j]
      }
    }
    return new Poly(result, this.variable)
  }

  div(other: Poly): { quotient: Poly; remainder: Poly } {
    if (other.isZero()) {
      throw new Error('Division by zero polynomial')
    }

    if (this.degree() < other.degree()) {
      return { quotient: new Poly([0n], this.variable), remainder: this.clone() }
    }

    let remainder = this.clone()
    const quotientCoeffs: bigint[] = new Array(this.degree() - other.degree() + 1).fill(0n)

    while (remainder.degree() >= other.degree() && !remainder.isZero()) {
      const diffDeg = remainder.degree() - other.degree()
      const leadRatio = remainder.leadingCoeff() / other.leadingCoeff()
      quotientCoeffs[diffDeg] = leadRatio

      const term = new Poly(
        [...new Array(diffDeg).fill(0n), leadRatio],
        this.variable
      )

      remainder = remainder.sub(term.mul(other))
    }

    return {
      quotient: new Poly(quotientCoeffs, this.variable),
      remainder: remainder,
    }
  }

  mod(other: Poly): Poly {
    return this.div(other).remainder
  }

  gcd(other: Poly): Poly {
    let a = this.clone()
    let b = other.clone()

    while (!b.isZero()) {
      const temp = b.clone()
      b = a.mod(b)
      a = temp
    }

    const lc = a.leadingCoeff()
    if (lc !== 1n && lc !== -1n) {
      const normalizedCoeffs = a.coeffs.map(c => c / lc)
      return new Poly(normalizedCoeffs, a.variable)
    }

    return a
  }

  lcm(other: Poly): Poly {
    return this.mul(other).div(this.gcd(other)).quotient
  }

  evaluate(x: bigint | number): bigint {
    let result = 0n
    let xPow: bigint = 1n
    const xVal = typeof x === 'bigint' ? x : BigInt(x)

    for (let i = 0; i < this.coeffs.length; i++) {
      result += this.coeffs[i] * xPow
      xPow *= xVal
    }

    return result
  }

  derivative(): Poly {
    if (this.coeffs.length <= 1) {
      return new Poly([0n], this.variable)
    }

    const derivCoeffs: bigint[] = []
    for (let i = 1; i < this.coeffs.length; i++) {
      derivCoeffs.push(this.coeffs[i] * BigInt(i))
    }

    return new Poly(derivCoeffs, this.variable)
  }

  integral(): Poly {
    const integCoeffs: bigint[] = [0n]
    for (let i = 0; i < this.coeffs.length; i++) {
      integCoeffs.push(this.coeffs[i] / BigInt(i + 1))
    }

    return new Poly(integCoeffs, this.variable)
  }

  isZero(): boolean {
    return this.coeffs.length === 1 && this.coeffs[0] === 0n
  }

  isOne(): boolean {
    return this.coeffs.length === 1 && this.coeffs[0] === 1n
  }

  equals(other: Poly): boolean {
    if (this.degree() !== other.degree()) return false
    for (let i = 0; i < this.coeffs.length; i++) {
      if (this.coeffs[i] !== other.coeffs[i]) return false
    }
    return true
  }

  toString(): string {
    if (this.isZero()) return '0'

    const terms: string[] = []
    for (let i = this.coeffs.length - 1; i >= 0; i--) {
      const coeff = this.coeffs[i]
      if (coeff === 0n) continue

      let term = ''
      if (i === 0) {
        term = coeff.toString()
      } else {
        const absCoeff = coeff < 0n ? -coeff : coeff
        if (absCoeff === 1n) {
          term = ''
        } else {
          term = absCoeff.toString()
        }

        if (i === 1) {
          term += this.variable.toString()
        } else {
          term += this.variable.toString() + '^' + i
        }
      }

      if (coeff < 0n) {
        terms.push('-' + term)
      } else {
        terms.push(term)
      }
    }

    return terms.join(' + ').replace(/\+ -/g, '- ')
  }

  clone(): Poly {
    return new Poly([...this.coeffs], this.variable)
  }

  toExpression(): Expression {
    let expr: Expression = new Integer(0)

    for (let i = this.coeffs.length - 1; i >= 0; i--) {
      if (this.coeffs[i] === 0n) continue

      let term: Expression = new Integer(this.coeffs[i])

      if (i > 0) {
        term = new Mul(term, new Pow(this.variable, new Integer(i)))
      }

      expr = new Add(expr, term)
    }

    return expr
  }

  static fromExpression(): Poly | null {
    return null
  }
}

export function polyGcd(a: Poly, b: Poly): Poly {
  return a.gcd(b)
}

export function polyLcm(a: Poly, b: Poly): Poly {
  return a.lcm(b)
}

export default Poly