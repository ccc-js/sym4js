import { type ExprJSON } from './types.js'

export interface Expression {
  readonly type: string
  readonly args: Expression[]

  // eslint-disable-next-line no-unused-vars
  equals(other: Expression): boolean
  toJSON(): ExprJSON
  toString(): string
  valueOf(): unknown
  clone(): Expression

  // eslint-disable-next-line no-unused-vars
  add(other: Expression): Expression
  // eslint-disable-next-line no-unused-vars
  sub(other: Expression): Expression
  // eslint-disable-next-line no-unused-vars
  mul(other: Expression): Expression
  // eslint-disable-next-line no-unused-vars
  div(other: Expression): Expression
  // eslint-disable-next-line no-unused-vars
  pow(other: Expression): Expression
  negate(): Expression
}

export function isZero(expr: Expression): boolean {
  return expr.type === 'integer' && (expr as Integer).value === 0n
}

export function isOne(expr: Expression): boolean {
  return expr.type === 'integer' && (expr as Integer).value === 1n
}

export function isNegativeOne(expr: Expression): boolean {
  return expr.type === 'integer' && (expr as Integer).value === -1n
}

export class Integer implements Expression {
  readonly type = 'integer' as const
  readonly value: bigint
  readonly args: never[] = []

  constructor(value: number | bigint | string) {
    if (typeof value === 'string') {
      this.value = BigInt(value)
    } else if (typeof value === 'number') {
      this.value = BigInt(Math.floor(value))
    } else {
      this.value = value
    }
  }

  equals(other: Expression): boolean {
    return other.type === 'integer' && (other as Integer).value === this.value
  }

  toJSON(): ExprJSON {
    return { type: 'integer', value: this.value.toString() }
  }

  clone(): Integer {
    return new Integer(this.value)
  }

  toString(): string {
    return this.value.toString()
  }

  valueOf(): bigint {
    return this.value
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createSub(this, other)
  }

  mul(other: Expression): Expression {
    return createMul(this, other)
  }

  div(other: Expression): Expression {
    return createDiv(this, other)
  }

  pow(other: Expression): Expression {
    return createPow(this, other)
  }

  negate(): Expression {
    return new Integer(-this.value)
  }

  isPositive(): boolean {
    return this.value > 0n
  }

  isNegative(): boolean {
    return this.value < 0n
  }

  isZero(): boolean {
    return this.value === 0n
  }

  isInteger(): boolean {
    return true
  }
}

export class Symbol implements Expression {
  readonly type = 'symbol' as const
  readonly name: string
  readonly args: never[] = []
  private _assumptions: Record<string, boolean>

  constructor(name: string, assumptions: Record<string, boolean> = {}) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      throw new Error(`Invalid symbol name: ${name}`)
    }
    this.name = name
    this._assumptions = { ...assumptions }
  }

  equals(other: Expression): boolean {
    return other.type === 'symbol' && (other as Symbol).name === this.name
  }

  toJSON(): ExprJSON {
    return { type: 'symbol', name: this.name }
  }

  clone(): Symbol {
    return new Symbol(this.name, { ...this._assumptions })
  }

  toString(): string {
    return this.name
  }

  valueOf(): string {
    return this.name
  }

  isPositive(): boolean {
    return this._assumptions['positive'] ?? false
  }

  isNegative(): boolean {
    return this._assumptions['negative'] ?? false
  }

  isZero(): boolean {
    return this._assumptions['zero'] ?? false
  }

  isInteger(): boolean {
    return this._assumptions['integer'] ?? false
  }

  isReal(): boolean {
    return this._assumptions['real'] ?? false
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createSub(this, other)
  }

  mul(other: Expression): Expression {
    return createMul(this, other)
  }

  div(other: Expression): Expression {
    return createDiv(this, other)
  }

  pow(other: Expression): Expression {
    return createPow(this, other)
  }

  negate(): Expression {
    return createNeg(this)
  }
}

export function symbolKey(expr: Expression): string {
  if (expr.type === 'symbol') {
    return `s:${(expr as Symbol).name}`
  }
  if (expr.type === 'pow') {
    const p = expr as Pow
    return `p:${symbolKey(p.base)}:${symbolKey(p.exp)}`
  }
  if (expr.type === 'mul') {
    const m = expr as Mul
    return m.args.map((a) => symbolKey(a)).join('*')
  }
  if (expr.type === 'neg') {
    return `n:${symbolKey((expr as Neg).arg)}`
  }
  if (expr.type === 'integer') {
    return `i:${(expr as Integer).value}`
  }
  return `?:${expr.toString()}`
}

export function asBaseExp(expr: Expression): [base: Expression, exp: Expression] {
  if (expr.type === 'pow') {
    const p = expr as Pow
    return [p.base, p.exp]
  }
  return [expr, One]
}

export function asCoeffMul(expr: Expression): [coeff: Expression, rest: Expression] {
  if (expr.type === 'mul') {
    const m = expr as Mul
    if (m.args.length >= 2 && m.args[0].type === 'integer') {
      return [m.args[0], new Mul(...m.args.slice(1))]
    }
  }
  if (expr.type === 'integer') {
    return [expr, One]
  }
  return [One, expr]
}

export class Add implements Expression {
  readonly type = 'add' as const
  readonly args: Expression[]

  constructor(...args: Expression[]) {
    this.args = Add.flatten(args)
  }

  static flatten(args: Expression[]): Expression[] {
    const termMap: Map<string, Expression> = new Map()

    for (const arg of args) {
      if (arg.type === 'add') {
        for (const a of (arg as Add).args) {
          Add.addTerm(termMap, a)
        }
      } else if (arg.type === 'integer') {
        Add.addNumericTerm(termMap, (arg as Integer).value)
      } else if (arg.type === 'neg') {
        const neg = arg as Neg
        if (neg.arg.type === 'integer') {
          Add.addNumericTerm(termMap, -(neg.arg as Integer).value)
        } else {
          Add.addTerm(termMap, arg)
        }
      } else {
        Add.addTerm(termMap, arg)
      }
    }

    return Add.buildResult(termMap)
  }

  private static addNumericTerm(termMap: Map<string, Expression>, n: bigint): void {
    const key = '_num'
    const existing = termMap.get(key)
    if (existing) {
      n += (existing as Integer).value
    }
    if (n !== 0n) {
      termMap.set(key, new Integer(n))
    } else {
      termMap.delete(key)
    }
  }

  private static addTerm(termMap: Map<string, Expression>, arg: Expression): void {
    const [coeff, rest] = asCoeffMul(arg)
    let coeffVal = 1n
    if (coeff.type === 'integer') {
      coeffVal = (coeff as Integer).value
    }

    const key = symbolKey(rest)

    if (coeffVal === 0n) return

    const existing = termMap.get(key)
    if (existing) {
      const [existingCoeff] = asCoeffMul(existing)
      let existingVal = 0n
      if (existingCoeff.type === 'integer') {
        existingVal = (existingCoeff as Integer).value
      }

      const sum = existingVal + coeffVal
      if (sum === 0n) {
        termMap.delete(key)
      } else if (sum === 1n) {
        termMap.set(key, rest)
      } else if (sum === -1n) {
        termMap.set(key, createNeg(rest))
      } else {
        termMap.set(key, new Integer(sum).mul(rest))
      }
    } else {
      if (coeffVal === 1n) {
        termMap.set(key, rest)
      } else if (coeffVal === -1n) {
        termMap.set(key, createNeg(rest))
      } else {
        termMap.set(key, new Integer(coeffVal).mul(rest))
      }
    }
  }

  private static buildResult(termMap: Map<string, Expression>): Expression[] {
    const result: Expression[] = []
    let numericPart = 0n

    for (const [key, expr] of termMap) {
      if (key === '_num') {
        numericPart += (expr as Integer).value
      } else {
        result.push(expr)
      }
    }

    if (numericPart !== 0n) {
      result.unshift(new Integer(numericPart))
    }

    if (result.length === 0) return [Zero]
    return result
  }

  equals(other: Expression): boolean {
    if (other.type !== 'add') return false
    const o = other as Add
    if (this.args.length !== o.args.length) return false
    return this.args.every((arg, i) => arg.equals(o.args[i]))
  }

  toJSON(): ExprJSON {
    return { type: 'add', args: this.args.map((a) => a.toJSON()) }
  }

  clone(): Add {
    return new Add(...this.args.map((a) => a.clone()))
  }

  toString(): string {
    const parts: string[] = []
    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i]
      const str = arg.toString()
      if (i === 0) {
        parts.push(str)
      } else if (arg.type === 'neg') {
        parts.push(str)
      } else if (arg.type === 'add' || arg.type === 'mul') {
        parts.push(`+(${str})`)
      } else {
        parts.push(`+${str}`)
      }
    }
    return parts.join('')
  }

  valueOf(): string {
    return this.toString()
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createSub(this, other)
  }

  mul(other: Expression): Expression {
    return createMul(this, other)
  }

  div(other: Expression): Expression {
    return createDiv(this, other)
  }

  pow(other: Expression): Expression {
    return createPow(this, other)
  }

  negate(): Expression {
    return createNeg(this)
  }
}

export class Mul implements Expression {
  readonly type = 'mul' as const
  readonly args: Expression[]

  constructor(...args: Expression[]) {
    this.args = Mul.flatten(args)
  }

  static flatten(args: Expression[]): Expression[] {
    const powerMap: Map<string, Expression> = new Map()
    let coeff = 1n

    for (const arg of args) {
      if (arg.type === 'mul') {
        for (const a of (arg as Mul).args) {
          Mul.addFactor(powerMap, a)
        }
      } else if (arg.type === 'integer') {
        coeff *= (arg as Integer).value
      } else if (arg.type === 'neg') {
        const neg = arg as Neg
        if (neg.arg.type === 'integer') {
          coeff *= -(neg.arg as Integer).value
        } else {
          Mul.addFactor(powerMap, arg)
        }
      } else {
        Mul.addFactor(powerMap, arg)
      }
    }

    return Mul.buildResult(powerMap, coeff)
  }

  private static addFactor(powerMap: Map<string, Expression>, arg: Expression): void {
    const [base, exp] = asBaseExp(arg)
    let expVal = 1n

    if (exp.type === 'integer') {
      expVal = (exp as Integer).value
    } else {
      Mul.addNonIntExp(powerMap, base, exp)
      return
    }

    if (base.type === 'integer') {
      Mul.addNonIntExp(powerMap, base, new Integer(expVal))
      return
    }

    const key = symbolKey(base)

    if (expVal === 0n) return

    const existing = powerMap.get(key)
    if (existing) {
      const [, existingExp] = asBaseExp(existing)
      let existingExpVal = 1n
      if (existingExp.type === 'integer') {
        existingExpVal = (existingExp as Integer).value
      }

      const sum = existingExpVal + expVal
      if (sum === 0n) {
        powerMap.delete(key)
      } else if (sum === 1n) {
        powerMap.set(key, base)
      } else {
        powerMap.set(key, new Pow(base, new Integer(sum)))
      }
    } else {
      if (expVal === 1n) {
        powerMap.set(key, base)
      } else {
        powerMap.set(key, new Pow(base, new Integer(expVal)))
      }
    }
  }

  private static addNonIntExp(
    powerMap: Map<string, Expression>,
    base: Expression,
    exp: Expression
  ): void {
    const key = `pow:${symbolKey(base)}:${symbolKey(exp)}`
    const existing = powerMap.get(key)
    if (existing) {
      const [, existingExp] = asBaseExp(existing)
      if (existingExp.type === 'integer' && exp.type === 'integer') {
        const existingExpVal = (existingExp as Integer).value
        const expVal = (exp as Integer).value
        const newExp = existingExpVal + expVal
        if (newExp === 0n) {
          powerMap.delete(key)
        } else {
          powerMap.set(key, new Pow(base, new Integer(newExp)))
        }
      } else {
        powerMap.set(key, new Pow(base, exp))
      }
    } else {
      powerMap.set(key, new Pow(base, exp))
    }
  }

  private static buildResult(powerMap: Map<string, Expression>, coeff: bigint): Expression[] {
    const result: Expression[] = []

    if (coeff !== 1n) {
      if (coeff === 0n) {
        return [Zero]
      }
      result.push(new Integer(coeff))
    }

    for (const [, expr] of powerMap) {
      if (expr.type === 'pow') {
        const p = expr as Pow
        if (p.exp.type === 'integer' && (p.exp as Integer).value === 0n) {
          continue
        }
        if (p.exp.type === 'integer' && (p.exp as Integer).value === 1n) {
          result.push(p.base)
          continue
        }
      }
      result.push(expr)
    }

    if (result.length === 0) return [One]
    if (result.length === 1) {
      const r = result[0]
      if (r.type === 'integer') return result
      if (r.type === 'symbol' || r.type === 'pow' || r.type === 'neg') return result
    }

    return result
  }

  equals(other: Expression): boolean {
    if (other.type !== 'mul') return false
    const o = other as Mul
    if (this.args.length !== o.args.length) return false
    return this.args.every((arg, i) => arg.equals(o.args[i]))
  }

  toJSON(): ExprJSON {
    return { type: 'mul', args: this.args.map((a) => a.toJSON()) }
  }

  clone(): Mul {
    return new Mul(...this.args.map((a) => a.clone()))
  }

  toString(): string {
    if (this.args.length === 0) return '1'
    const parts: string[] = []
    for (const arg of this.args) {
      const str = arg.toString()
      if (arg.type === 'add') {
        parts.push(`(${str})`)
      } else if (parts.length > 0) {
        parts.push(`*${str}`)
      } else {
        parts.push(str)
      }
    }
    return parts.join('')
  }

  valueOf(): string {
    return this.toString()
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createSub(this, other)
  }

  mul(other: Expression): Expression {
    return createMul(this, other)
  }

  div(other: Expression): Expression {
    return createDiv(this, other)
  }

  pow(other: Expression): Expression {
    return createPow(this, other)
  }

  negate(): Expression {
    return createNeg(this)
  }
}

export class Pow implements Expression {
  readonly type = 'pow' as const
  readonly base: Expression
  readonly exp: Expression
  readonly args: Expression[]

  constructor(base: Expression, exp: Expression) {
    this.base = base
    this.exp = exp
    this.args = [base, exp]
  }

  equals(other: Expression): boolean {
    if (other.type !== 'pow') return false
    const o = other as Pow
    return this.base.equals(o.base) && this.exp.equals(o.exp)
  }

  toJSON(): ExprJSON {
    return { type: 'pow', base: this.base.toJSON(), exp: this.exp.toJSON() }
  }

  clone(): Pow {
    return new Pow(this.base.clone(), this.exp.clone())
  }

  toString(): string {
    const baseStr = this.base.toString()
    const expStr = this.exp.toString()
    let result = baseStr
    if (this.base.type === 'add' || this.base.type === 'mul' || this.base.type === 'neg') {
      result = `(${baseStr})`
    }
    result += `**${expStr}`
    return result
  }

  valueOf(): string {
    return this.toString()
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createSub(this, other)
  }

  mul(other: Expression): Expression {
    return createMul(this, other)
  }

  div(other: Expression): Expression {
    return createDiv(this, other)
  }

  pow(other: Expression): Expression {
    return createPow(this, other)
  }

  negate(): Expression {
    return createNeg(this)
  }
}

export class Neg implements Expression {
  readonly type = 'neg' as const
  readonly arg: Expression
  readonly args: Expression[]

  constructor(arg: Expression) {
    this.arg = arg
    this.args = [arg]
  }

  equals(other: Expression): boolean {
    return other.type === 'neg' && this.arg.equals((other as Neg).arg)
  }

  toJSON(): ExprJSON {
    return { type: 'neg', args: [this.arg.toJSON()] }
  }

  clone(): Neg {
    return new Neg(this.arg.clone())
  }

  toString(): string {
    const argStr = this.arg.toString()
    if (this.arg.type === 'add' || this.arg.type === 'mul') {
      return `-(${argStr})`
    }
    return `-${argStr}`
  }

  valueOf(): string {
    return this.toString()
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createSub(this, other)
  }

  mul(other: Expression): Expression {
    return createMul(this, other)
  }

  div(other: Expression): Expression {
    return createDiv(this, other)
  }

  pow(other: Expression): Expression {
    return createPow(this, other)
  }

  negate(): Expression {
    return this.arg.clone()
  }
}

export class Div implements Expression {
  readonly type = 'div' as const
  readonly numerator: Expression
  readonly denominator: Expression
  readonly args: Expression[]

  constructor(numerator: Expression, denominator: Expression) {
    this.numerator = numerator
    this.denominator = denominator
    this.args = [numerator, denominator]
  }

  equals(other: Expression): boolean {
    if (other.type !== 'div') return false
    const o = other as Div
    return this.numerator.equals(o.numerator) && this.denominator.equals(o.denominator)
  }

  toJSON(): ExprJSON {
    return { type: 'div', args: [this.numerator.toJSON(), this.denominator.toJSON()] }
  }

  clone(): Div {
    return new Div(this.numerator.clone(), this.denominator.clone())
  }

  toString(): string {
    const numStr = this.numerator.toString()
    const denStr = this.denominator.toString()
    const numPart =
      this.numerator.type === 'add' || this.numerator.type === 'mul' ? `(${numStr})` : numStr
    const denPart =
      this.denominator.type === 'add' || this.denominator.type === 'mul'
        ? `(${denStr})`
        : denStr
    return `${numPart}/${denPart}`
  }

  valueOf(): string {
    return this.toString()
  }

  add(other: Expression): Expression {
    return createAdd(this, other)
  }

  sub(other: Expression): Expression {
    return createSub(this, other)
  }

  mul(other: Expression): Expression {
    return createMul(this, other)
  }

  div(other: Expression): Expression {
    return createDiv(this, other)
  }

  pow(other: Expression): Expression {
    return createPow(this, other)
  }

  negate(): Expression {
    return createNeg(this)
  }
}

export const Zero = new Integer(0)
export const One = new Integer(1)
export const Two = new Integer(2)

export function createAdd(a: Expression, b: Expression): Expression {
  const terms: Expression[] = []
  if (a.type === 'add') {
    terms.push(...(a as Add).args)
  } else {
    terms.push(a)
  }
  if (b.type === 'add') {
    terms.push(...(b as Add).args)
  } else {
    terms.push(b)
  }
  const result = new Add(...terms)
  const args = result.args

  if (args.length === 1) {
    const single = args[0]
    if (single.type === 'integer' && (single as Integer).value === 0n) {
      return Zero
    }
    return single
  }

  return result
}

function createSub(a: Expression, b: Expression): Expression {
  return createAdd(a, createNeg(b))
}

function createMul(a: Expression, b: Expression): Expression {
  const factors: Expression[] = []
  if (a.type === 'mul') {
    factors.push(...(a as Mul).args)
  } else {
    factors.push(a)
  }
  if (b.type === 'mul') {
    factors.push(...(b as Mul).args)
  } else {
    factors.push(b)
  }
  const result = new Mul(...factors)
  const args = result.args
  if (args.length === 1) {
    const single = args[0]
    if (single.type === 'integer' && (single as Integer).value === 0n) {
      return Zero
    }
    if (single.type === 'integer' && (single as Integer).value === 1n) {
      return One
    }
    return single
  }
  return result
}

function createDiv(a: Expression, b: Expression): Expression {
  return new Div(a, b)
}

function createPow(base: Expression, exp: Expression): Expression {
  return new Pow(base, exp)
}

export function createNeg(arg: Expression): Expression {
  if (arg.type === 'neg') return (arg as Neg).arg
  if (arg.type === 'integer') {
    const i = arg as Integer
    return new Integer(-i.value)
  }
  return new Neg(arg)
}

export function symbols(...names: string[]): Symbol[] {
  return names.map((name) => new Symbol(name))
}
