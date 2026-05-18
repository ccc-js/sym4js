import {
  type Expression,
  Mul,
  Pow,
  Div,
  createAdd,
  createNeg,
} from '../core/expr.js'

export class Sin implements Expression {
  readonly type = 'sin' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'sin' && this.arg.equals((other as Sin).arg)
  }

  toJSON() {
    return { type: 'sin', args: [this.arg.toJSON()] }
  }

  clone(): Sin {
    return new Sin(this.arg.clone())
  }

  toString(): string {
    return `sin(${this.arg.toString()})`
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

export class Cos implements Expression {
  readonly type = 'cos' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'cos' && this.arg.equals((other as Cos).arg)
  }

  toJSON() {
    return { type: 'cos', args: [this.arg.toJSON()] }
  }

  clone(): Cos {
    return new Cos(this.arg.clone())
  }

  toString(): string {
    return `cos(${this.arg.toString()})`
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

export class Tan implements Expression {
  readonly type = 'tan' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'tan' && this.arg.equals((other as Tan).arg)
  }

  toJSON() {
    return { type: 'tan', args: [this.arg.toJSON()] }
  }

  clone(): Tan {
    return new Tan(this.arg.clone())
  }

  toString(): string {
    return `tan(${this.arg.toString()})`
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

export class Log implements Expression {
  readonly type = 'log' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'log' && this.arg.equals((other as Log).arg)
  }

  toJSON() {
    return { type: 'log', args: [this.arg.toJSON()] }
  }

  clone(): Log {
    return new Log(this.arg.clone())
  }

  toString(): string {
    return `log(${this.arg.toString()})`
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

export class Exp implements Expression {
  readonly type = 'exp' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'exp' && this.arg.equals((other as Exp).arg)
  }

  toJSON() {
    return { type: 'exp', args: [this.arg.toJSON()] }
  }

  clone(): Exp {
    return new Exp(this.arg.clone())
  }

  toString(): string {
    return `exp(${this.arg.toString()})`
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

export default { Sin, Cos, Tan, Log, Exp }