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
  createAdd,
} from './core/expr.js'
import { substitute } from './operations/substitute.js'
import { simplify } from './operations/simplify.js'
import { expand } from './operations/expand.js'
import { factor } from './operations/factor.js'
import { diff } from './operations/diff.js'
import { integrate } from './operations/integrate.js'
import { limit } from './operations/limit.js'
import { solve, solveLinearSystem, solveODE } from './operations/solve.js'
import {
  Sin, Cos, Tan, Cot, Sec, Csc, Log, Exp,
  Asin, Acos, Atan, Sinh, Cosh, Tanh,
} from './functions/trig.js'
import { Matrix } from './matrix/matrix.js'
import { series, taylor, maclaurin } from './series/series.js'

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
  createAdd,
  substitute,
  simplify,
  expand,
  factor,
  diff,
  integrate,
  limit,
  solve,
  solveLinearSystem,
  solveODE,
  Sin,
  Cos,
  Tan,
  Cot,
  Sec,
  Csc,
  Log,
  Exp,
  Asin,
  Acos,
  Atan,
  Sinh,
  Cosh,
  Tanh,
  Matrix,
  series,
  taylor,
  maclaurin,
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
  factor,
  diff,
  integrate,
  limit,
  solve,
  solveLinearSystem,
  solveODE,
  sympify,
  symbols,
  createAdd,
  Sin,
  Cos,
  Tan,
  Cot,
  Sec,
  Csc,
  Log,
  Exp,
  Asin,
  Acos,
  Atan,
  Sinh,
  Cosh,
  Tanh,
  Matrix,
  series,
  taylor,
  maclaurin,
}

export default sym4js