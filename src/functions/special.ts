import { type Expression, Mul, Pow, Div, createNeg, createAdd } from '../core/expr.js'

export class Gamma implements Expression {
  readonly type = 'gamma' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'gamma' && this.arg.equals((other as Gamma).arg)
  }

  toJSON() {
    return { type: 'gamma', args: [this.arg.toJSON()] }
  }

  clone(): Gamma {
    return new Gamma(this.arg.clone())
  }

  toString(): string {
    return `Gamma(${this.arg.toString()})`
  }

  valueOf(): string {
    return this.toString()
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createAdd(this, createNeg(other))
  }

  mul(other: Expression): Expression {
    return new Mul(this, other)
  }

  div(other: Expression): Expression {
    return new Div(this, other)
  }

  pow(other: Expression): Expression {
    return new Pow(this, other)
  }

  negate(): Expression {
    return createNeg(this)
  }
}

export class Beta implements Expression {
  readonly type = 'beta' as const
  readonly arg1: Expression
  readonly arg2: Expression
  readonly args: Expression[]

  constructor(arg1: Expression, arg2: Expression) {
    this.arg1 = arg1
    this.arg2 = arg2
    this.args = [arg1, arg2]
  }

  equals(other: Expression): boolean {
    if (other.type !== 'beta') return false
    const o = other as Beta
    return this.arg1.equals(o.arg1) && this.arg2.equals(o.arg2)
  }

  toJSON() {
    return { type: 'beta', args: [this.arg1.toJSON(), this.arg2.toJSON()] }
  }

  clone(): Beta {
    return new Beta(this.arg1.clone(), this.arg2.clone())
  }

  toString(): string {
    return `Beta(${this.arg1.toString()}, ${this.arg2.toString()})`
  }

  valueOf(): string {
    return this.toString()
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createAdd(this, createNeg(other))
  }

  mul(other: Expression): Expression {
    return new Mul(this, other)
  }

  div(other: Expression): Expression {
    return new Div(this, other)
  }

  pow(other: Expression): Expression {
    return new Pow(this, other)
  }

  negate(): Expression {
    return createNeg(this)
  }
}

export class Bessel implements Expression {
  readonly type = 'bessel' as const
  readonly order: Expression
  readonly arg: Expression
  readonly args: Expression[]

  constructor(order: Expression, arg: Expression) {
    this.order = order
    this.arg = arg
    this.args = [order, arg]
  }

  equals(other: Expression): boolean {
    if (other.type !== 'bessel') return false
    const o = other as Bessel
    return this.order.equals(o.order) && this.arg.equals(o.arg)
  }

  toJSON() {
    return { type: 'bessel', args: [this.order.toJSON(), this.arg.toJSON()] }
  }

  clone(): Bessel {
    return new Bessel(this.order.clone(), this.arg.clone())
  }

  toString(): string {
    return `BesselJ(${this.order.toString()}, ${this.arg.toString()})`
  }

  valueOf(): string {
    return this.toString()
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createAdd(this, createNeg(other))
  }

  mul(other: Expression): Expression {
    return new Mul(this, other)
  }

  div(other: Expression): Expression {
    return new Div(this, other)
  }

  pow(other: Expression): Expression {
    return new Pow(this, other)
  }

  negate(): Expression {
    return createNeg(this)
  }
}

export class Legendre implements Expression {
  readonly type = 'legendre' as const
  readonly n: Expression
  readonly arg: Expression
  readonly args: Expression[]

  constructor(n: Expression, arg: Expression) {
    this.n = n
    this.arg = arg
    this.args = [n, arg]
  }

  equals(other: Expression): boolean {
    if (other.type !== 'legendre') return false
    const o = other as Legendre
    return this.n.equals(o.n) && this.arg.equals(o.arg)
  }

  toJSON() {
    return { type: 'legendre', args: [this.n.toJSON(), this.arg.toJSON()] }
  }

  clone(): Legendre {
    return new Legendre(this.n.clone(), this.arg.clone())
  }

  toString(): string {
    return `P_${this.n.toString()}(${this.arg.toString()})`
  }

  valueOf(): string {
    return this.toString()
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createAdd(this, createNeg(other))
  }

  mul(other: Expression): Expression {
    return new Mul(this, other)
  }

  div(other: Expression): Expression {
    return new Div(this, other)
  }

  pow(other: Expression): Expression {
    return new Pow(this, other)
  }

  negate(): Expression {
    return createNeg(this)
  }

  static evaluate(n: number, x: number | bigint): number {
    const xVal = typeof x === 'bigint' ? Number(x) : x

    if (n === 0) return 1
    if (n === 1) return xVal

    let p0 = 1
    let p1 = xVal

    for (let k = 2; k <= n; k++) {
      const pk = ((2 * k - 1) * xVal * p1 - (k - 1) * p0) / k
      p0 = p1
      p1 = pk
    }

    return p1
  }
}

export default { Gamma, Beta, Bessel, Legendre }