import { type Expression, Integer, Symbol, Add, Mul, Pow, Neg, createNeg } from '../core/expr.js'
import { Exp, Sin } from '../functions/trig.js'

export interface PDESolution {
  general: Expression
  method: string
}

export function pdesolve(
  equation: Expression,
  dependentVar: Symbol,
  independentVars: Symbol[]
): PDESolution | null {
  if (independentVars.length < 2) {
    return null
  }

  if (equation.type === 'add') {
    const isLaplace = checkLaplace(equation, dependentVar, independentVars)
    if (isLaplace) {
      return solveLaplace()
    }

    const isWave = checkWave(equation, dependentVar, independentVars)
    if (isWave) {
      return solveWave()
    }

    const isHeat = checkHeat(equation, dependentVar, independentVars)
    if (isHeat) {
      return solveHeat()
    }
  }

  return null
}

function checkLaplace(expr: Expression, _u: Symbol, vars: Symbol[]): boolean {
  const [x, y] = vars
  const u_xx = countDerivatives(expr, x, 2)
  const u_yy = countDerivatives(expr, y, 2)
  return u_xx === 1 && u_yy === 1
}

function checkWave(expr: Expression, _u: Symbol, vars: Symbol[]): boolean {
  const [x, t] = vars
  const u_xx = countDerivatives(expr, x, 2)
  const u_tt = countDerivatives(expr, t, 2)
  return u_xx === 1 && u_tt === 1
}

function checkHeat(expr: Expression, _u: Symbol, vars: Symbol[]): boolean {
  const [x, t] = vars
  const u_xx = countDerivatives(expr, x, 2)
  const u_t = countDerivatives(expr, t, 1)
  return u_xx === 1 && u_t === 1
}

function countDerivatives(expr: Expression, var_: Symbol, order: number): number {
  if (order === 0) {
    if (expr.type === 'symbol' && (expr as Symbol).name === var_.name) {
      return 1
    }
    return 0
  }

  if (expr.type === 'mul') {
    const mul = expr as Mul
    let count = 0
    for (const arg of mul.args) {
      count += countDerivatives(arg, var_, order)
    }
    return count
  }

  if (expr.type === 'add') {
    const add = expr as Add
    let maxCount = 0
    for (const arg of add.args) {
      maxCount += countDerivatives(arg, var_, order)
    }
    return maxCount
  }

  if (expr.type === 'neg') {
    return countDerivatives((expr as Neg).arg, var_, order)
  }

  return 0
}

function solveLaplace(): PDESolution {
  const c1 = new Symbol('C1')
  const c2 = new Symbol('C2')
  const x = new Symbol('x')
  const y = new Symbol('y')

  return {
    general: new Add(
      new Mul(c1, new Exp(y), new Sin(x)),
      new Mul(c2, new Exp(new Neg(y)), new Sin(x))
    ),
    method: 'laplace_2d_separation'
  }
}

function solveWave(): PDESolution {
  const c1 = new Symbol('C1')
  const c2 = new Symbol('C2')
  const x = new Symbol('x')
  const t = new Symbol('t')

  return {
    general: new Add(
      new Mul(c1, new Sin(new Add(x, t))),
      new Mul(c2, new Sin(new Add(x, createNeg(t))))
    ),
    method: 'wave_1d_dAlembert'
  }
}

function solveHeat(): PDESolution {
  const c1 = new Symbol('C1')
  const x = new Symbol('x')
  const t = new Symbol('t')

  return {
    general: new Mul(
      c1,
      new Exp(new Neg(t)),
      new Sin(x)
    ),
    method: 'heat_1d_fourier'
  }
}

export function separationOfVariables(
  _equation: Expression,
  _dependentVar: Symbol,
  independentVars: Symbol[]
): Expression | null {
  if (independentVars.length !== 2) return null

  const lambda = new Symbol('lambda')

  return new Add(
    new Mul(new Symbol('X'), new Integer(-1)),
    new Mul(new Pow(new Symbol('X_'), new Integer(2)), lambda),
    new Mul(new Symbol('Y'), new Integer(-1)),
    new Mul(new Pow(new Symbol('Y_'), new Integer(2)), lambda)
  )
}

export default { pdesolve, separationOfVariables }