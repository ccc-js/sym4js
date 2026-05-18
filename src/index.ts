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
import { expand } from './operations/expand.js'
import { diff } from './operations/diff.js'
import { Sin, Cos, Tan, Log, Exp } from './functions/trig.js'

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
  expand,
  diff,
  Sin,
  Cos,
  Tan,
  Log,
  Exp,
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
  expand,
  diff,
  sympify,
  symbols,
  Sin,
  Cos,
  Tan,
}

export default sym4js