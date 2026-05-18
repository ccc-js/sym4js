import { Integer, Symbol, Expression, Add, Mul, Pow, Neg } from '../core/expr.js'

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

  roots(): bigint[] | null {
    if (this.coeffs.length === 0) return null
    if (this.degree() === 0) return []

    const leadingCoeff = this.leadingCoeff()
    if (leadingCoeff === 0n) {
      const shifted = new Poly(this.coeffs.slice(0, -1), this.variable)
      return shifted.roots()
    }

    if (this.degree() === 1) {
      const [a, b] = this.coeffs
      if (a === 0n) return null
      return [-b / a]
    }

    if (this.degree() === 2) {
      const [c, b, a] = this.coeffs
      if (a === 0n) return null

      const discriminant = b * b - 4n * a * c
      if (discriminant < 0n) return []

      const sqrtD = this.integerSqrt(discriminant)
      if (sqrtD === null) return null

      const twoA = 2n * a
      return [(-b + sqrtD) / twoA, (-b - sqrtD) / twoA]
    }

    return null
  }

  private integerSqrt(n: bigint): bigint | null {
    if (n < 0n) return null
    if (n === 0n) return 0n
    let low = 0n
    let high = n
    while (low <= high) {
      const mid = (low + high) / 2n
      const sq = mid * mid
      if (sq === n) return mid
      if (sq < n) {
        low = mid + 1n
      } else {
        high = mid - 1n
      }
    }
    return null
  }

  rationalRoots(): (bigint | null)[] | null {
    if (this.isZero()) return null
    if (this.degree() <= 0) return []

    const a = this.leadingCoeff()
    const b = this.constant()

    if (a === 0n) {
      const shifted = new Poly(this.coeffs.slice(0, -1), this.variable)
      return shifted.rationalRoots()
    }

    const candidates: bigint[] = []
    const aDivisors = this.divisors(a < 0n ? -a : a)
    const bDivisors = this.divisors(b < 0n ? -b : b)

    for (const p of bDivisors) {
      for (const q of aDivisors) {
        if (q !== 0n) {
          candidates.push(p / q)
          candidates.push(-p / q)
        }
      }
    }

    const roots: (bigint | null)[] = []
    for (const candidate of candidates) {
      if (this.evaluate(candidate) === 0n) {
        roots.push(candidate)
      }
    }

    return roots
  }

  private divisors(n: bigint): bigint[] {
    const divs: bigint[] = []
    for (let i = 1n; i * i <= n; i++) {
      if (n % i === 0n) {
        divs.push(i)
        if (i * i !== n) {
          divs.push(n / i)
        }
      }
    }
    return divs.sort((a, b) => a < b ? -1 : 1)
  }

  newtonRaphson(guess: number, tolerance: number = 1e-10, maxIter: number = 100): number | null {
    if (this.degree() === 0) return null

    const deriv = this.derivative()
    let x = guess

    for (let i = 0; i < maxIter; i++) {
      const fx = Number(this.evaluate(x))
      if (Math.abs(fx) < tolerance) {
        return x
      }

      const dfx = Number(deriv.evaluate(x))
      if (Math.abs(dfx) < 1e-15) {
        return null
      }

      x = x - fx / dfx
    }

    return null
  }

  allRoots(tolerance: number = 1e-10): (number | null)[] {
    if (this.isZero()) return []
    if (this.degree() <= 0) return []

    const rational = this.rationalRoots()
    const results: (number | null)[] = []

    if (rational && rational.length > 0) {
      for (const r of rational) {
        if (r !== null) {
          results.push(Number(r))
        }
      }
    }

    const deflated = this.deflateKnownRoots(results.filter(r => r !== null) as number[])

    if (deflated.degree() === 0) {
      return results
    }

    if (deflated.degree() === 1) {
      const [a, b] = deflated.coeffs
      if (a !== 0n) {
        results.push(Number(-b) / Number(a))
      }
      return results
    }

    if (deflated.degree() === 2) {
      const roots = deflated.roots()
      if (roots) {
        for (const r of roots) {
          results.push(Number(r))
        }
      }
      return results
    }

    const guesses = this.generateGuesses(deflated.degree())
    for (const g of guesses) {
      const root = deflated.newtonRaphson(g, tolerance)
      if (root !== null) {
        results.push(root)
      }
    }

    return results
  }

  private deflateKnownRoots(knownRoots: number[]): Poly {
    let result = this.clone()
    for (const r of knownRoots) {
      const rootPoly = new Poly([-r, 1n], this.variable)
      const { quotient } = result.div(rootPoly)
      result = quotient
    }
    return result
  }

  private generateGuesses(n: number): number[] {
    const guesses: number[] = []
    for (let i = 1; i <= n; i++) {
      guesses.push(i)
      guesses.push(-i)
      guesses.push(i * 0.5)
      guesses.push(-i * 0.5)
    }
    return guesses
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

  static fromExpression(expr: Expression, variable: Symbol = new Symbol('x')): Poly | null {
    try {
      const coeffs = this.exprToCoeffs(expr, variable)
      if (coeffs === null) return null
      return new Poly(coeffs, variable)
    } catch {
      return null
    }
  }

  private static exprToCoeffs(expr: Expression, variable: Symbol): bigint[] | null {
    if (expr.type === 'integer') {
      return [(expr as Integer).value]
    }

    if (expr.type === 'symbol') {
      const s = expr as Symbol
      if (s.name === variable.name) {
        return [0n, 1n]
      }
      return [1n]
    }

    if (expr.type === 'neg') {
      const neg = expr as Neg
      const innerCoeffs = this.exprToCoeffs(neg.arg, variable)
      if (innerCoeffs === null) return null
      return innerCoeffs.map(c => -c)
    }

    if (expr.type === 'add') {
      const add = expr as Add
      let result: bigint[] = [0n]
      for (const arg of add.args) {
        const argCoeffs = this.exprToCoeffs(arg, variable)
        if (argCoeffs === null) return null
        result = this.addCoeffs(result, argCoeffs)
      }
      return result
    }

    if (expr.type === 'mul') {
      const mul = expr as Mul
      let result: bigint[] = [1n]
      for (const arg of mul.args) {
        const argCoeffs = this.exprToCoeffs(arg, variable)
        if (argCoeffs === null) return null
        result = this.mulCoeffs(result, argCoeffs)
      }
      return result
    }

    if (expr.type === 'pow') {
      const p = expr as Pow
      if (p.base.type === 'symbol' && (p.base as Symbol).name === variable.name) {
        if (p.exp.type === 'integer') {
          const n = (p.exp as Integer).value
          if (n >= 0n && n <= 1000n) {
            return this.powerCoeffs([0n, 1n], Number(n))
          }
        }
      }
      if (p.base.type === 'integer' && p.exp.type === 'integer') {
        const baseVal = (p.base as Integer).value
        const expVal = (p.exp as Integer).value
        if (expVal >= 0n && expVal <= 1000n) {
          return [baseVal ** expVal]
        }
      }
    }

    return null
  }

  private static addCoeffs(a: bigint[], b: bigint[]): bigint[] {
    const maxLen = Math.max(a.length, b.length)
    const result: bigint[] = []
    for (let i = 0; i < maxLen; i++) {
      const aVal = i < a.length ? a[i] : 0n
      const bVal = i < b.length ? b[i] : 0n
      result.push(aVal + bVal)
    }
    return result
  }

  private static mulCoeffs(a: bigint[], b: bigint[]): bigint[] {
    if (a.length === 1 && a[0] === 0n) return [0n]
    if (b.length === 1 && b[0] === 0n) return [0n]
    const resultLen = a.length + b.length - 1
    const result: bigint[] = new Array(resultLen).fill(0n)
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        result[i + j] += a[i] * b[j]
      }
    }
    return result
  }

  private static powerCoeffs(coeffs: bigint[], exp: number): bigint[] {
    if (exp === 0) return [1n]
    if (exp === 1) return [...coeffs]
    let result: bigint[] = [1n]
    for (let i = 0; i < exp; i++) {
      result = this.mulCoeffs(result, coeffs)
    }
    return result
  }
}

export function polyGcd(a: Poly, b: Poly): Poly {
  return a.gcd(b)
}

export function polyLcm(a: Poly, b: Poly): Poly {
  return a.lcm(b)
}

export default Poly