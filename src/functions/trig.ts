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

  toLatex(): string {
    return `\\sin ${this.arg.toString()}`
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

  toLatex(): string {
    return `\\cos ${this.arg.toString()}`
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

  toLatex(): string {
    return `\\tan ${this.arg.toString()}`
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

  toLatex(): string {
    return `\\log ${this.arg.toString()}`
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

  toLatex(): string {
    return `e^{${this.arg.toString()}}`
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

export class Cot implements Expression {
  readonly type = 'cot' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'cot' && this.arg.equals((other as Cot).arg)
  }

  toJSON() {
    return { type: 'cot', args: [this.arg.toJSON()] }
  }

  clone(): Cot {
    return new Cot(this.arg.clone())
  }

  toString(): string {
    return `cot(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\cot ${this.arg.toString()}`
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

export class Sec implements Expression {
  readonly type = 'sec' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'sec' && this.arg.equals((other as Sec).arg)
  }

  toJSON() {
    return { type: 'sec', args: [this.arg.toJSON()] }
  }

  clone(): Sec {
    return new Sec(this.arg.clone())
  }

  toString(): string {
    return `sec(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\sec ${this.arg.toString()}`
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

export class Csc implements Expression {
  readonly type = 'csc' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'csc' && this.arg.equals((other as Csc).arg)
  }

  toJSON() {
    return { type: 'csc', args: [this.arg.toJSON()] }
  }

  clone(): Csc {
    return new Csc(this.arg.clone())
  }

  toString(): string {
    return `csc(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\csc ${this.arg.toString()}`
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

export class Asin implements Expression {
  readonly type = 'asin' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'asin' && this.arg.equals((other as Asin).arg)
  }

  toJSON() {
    return { type: 'asin', args: [this.arg.toJSON()] }
  }

  clone(): Asin {
    return new Asin(this.arg.clone())
  }

  toString(): string {
    return `asin(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\arcsin ${this.arg.toString()}`
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

export class Acos implements Expression {
  readonly type = 'acos' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'acos' && this.arg.equals((other as Acos).arg)
  }

  toJSON() {
    return { type: 'acos', args: [this.arg.toJSON()] }
  }

  clone(): Acos {
    return new Acos(this.arg.clone())
  }

  toString(): string {
    return `acos(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\arccos ${this.arg.toString()}`
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

export class Atan implements Expression {
  readonly type = 'atan' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'atan' && this.arg.equals((other as Atan).arg)
  }

  toJSON() {
    return { type: 'atan', args: [this.arg.toJSON()] }
  }

  clone(): Atan {
    return new Atan(this.arg.clone())
  }

  toString(): string {
    return `atan(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\arctan ${this.arg.toString()}`
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

export class Sinh implements Expression {
  readonly type = 'sinh' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'sinh' && this.arg.equals((other as Sinh).arg)
  }

  toJSON() {
    return { type: 'sinh', args: [this.arg.toJSON()] }
  }

  clone(): Sinh {
    return new Sinh(this.arg.clone())
  }

  toString(): string {
    return `sinh(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\sinh ${this.arg.toString()}`
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

export class Cosh implements Expression {
  readonly type = 'cosh' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'cosh' && this.arg.equals((other as Cosh).arg)
  }

  toJSON() {
    return { type: 'cosh', args: [this.arg.toJSON()] }
  }

  clone(): Cosh {
    return new Cosh(this.arg.clone())
  }

  toString(): string {
    return `cosh(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\cosh ${this.arg.toString()}`
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

export class Tanh implements Expression {
  readonly type = 'tanh' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'tanh' && this.arg.equals((other as Tanh).arg)
  }

  toJSON() {
    return { type: 'tanh', args: [this.arg.toJSON()] }
  }

  clone(): Tanh {
    return new Tanh(this.arg.clone())
  }

  toString(): string {
    return `tanh(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\tanh ${this.arg.toString()}`
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

export class Asinh implements Expression {
  readonly type = 'asinh' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'asinh' && this.arg.equals((other as Asinh).arg)
  }

  toJSON() {
    return { type: 'asinh', args: [this.arg.toJSON()] }
  }

  clone(): Asinh {
    return new Asinh(this.arg.clone())
  }

  toString(): string {
    return `asinh(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\operatorname{arsinh} ${this.arg.toString()}`
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

export class Acosh implements Expression {
  readonly type = 'acosh' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'acosh' && this.arg.equals((other as Acosh).arg)
  }

  toJSON() {
    return { type: 'acosh', args: [this.arg.toJSON()] }
  }

  clone(): Acosh {
    return new Acosh(this.arg.clone())
  }

  toString(): string {
    return `acosh(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\operatorname{arcosh} ${this.arg.toString()}`
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

export class Atanh implements Expression {
  readonly type = 'atanh' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'atanh' && this.arg.equals((other as Atanh).arg)
  }

  toJSON() {
    return { type: 'atanh', args: [this.arg.toJSON()] }
  }

  clone(): Atanh {
    return new Atanh(this.arg.clone())
  }

  toString(): string {
    return `atanh(${this.arg.toString()})`
  }

  toLatex(): string {
    return `\\operatorname{artanh} ${this.arg.toString()}`
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

export default { Sin, Cos, Tan, Cot, Sec, Csc, Log, Exp, Asin, Acos, Atan, Sinh, Cosh, Tanh, Asinh, Acosh, Atanh }