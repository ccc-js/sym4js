import {
  Symbol,
  Integer,
  Expression,
  Add,
  Mul,
  Pow,
  Neg,
  Div,
  Zero,
  One,
  Two,
  symbols,
  isZero,
  isOne,
  isNegativeOne,
} from './core/expr.js'
import { substitute } from './operations/substitute.js'
import { simplify } from './operations/simplify.js'

export {
  Symbol,
  Integer,
  Expression,
  Add,
  Mul,
  Pow,
  Neg,
  Div,
  Zero,
  One,
  Two,
  symbols,
  isZero,
  isOne,
  isNegativeOne,
  substitute,
  simplify,
}

export function sympify(value: string | number): Expression {
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return new Integer(value)
    }
    throw new Error('Float not supported yet')
  }
  throw new Error(`Cannot sympify: ${value}`)
}

const sym4js = {
  Symbol,
  Integer,
  Zero,
  One,
  Add,
  Mul,
  Pow,
  Neg,
  Div,
  substitute,
  simplify,
  sympify,
  symbols,
}

export default sym4js