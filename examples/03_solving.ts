import { Symbol, Integer, Add, Mul, Pow, Neg, Div } from '../src/index.js'
import { solve, solveLinearSystem, dsolve } from '../src/index.js'
import { diff, createNeg } from '../src/index.js'

console.log('=== Algebraic Equations ===\n')

const x = new Symbol('x')

// x² - 4 = 0  →  x = ±2
const eq1 = new Add(new Pow(x, new Integer(2)), new Neg(new Integer(4)))
console.log('Solve x² - 4 = 0')
const sol1 = solve(eq1, x)
console.log('x =', sol1.map(s => s.toString()))

console.log('\n// x³ - 8 = 0  →  x = 2')
const eq2 = new Add(new Pow(x, new Integer(3)), new Neg(new Integer(8)))
const sol2 = solve(eq2, x)
console.log('x =', sol2.map(s => s.toString()))

console.log('\n// x² + 2x + 1 = 0  →  x = -1')
const eq3 = new Add(new Pow(x, new Integer(2)), new Mul(new Integer(2), x), new Integer(1))
const sol3 = solve(eq3, x)
console.log('x =', sol3.map(s => s.toString()))

console.log('\n=== Linear Systems ===\n')

const y = new Symbol('y')

// 2x + y = 5
// x - y = 1
const eqs1 = [
  new Add(new Mul(new Integer(2), x), y, new Neg(new Integer(5))),
  new Add(x, createNeg(y), new Neg(new Integer(1)))
]
console.log('System:')
console.log('  2x + y = 5')
console.log('  x - y = 1')
const sysSol1 = solveLinearSystem(eqs1, [x, y])
console.log('Solution:', sysSol1)

console.log('\n=== ODE Solving ===\n')

const t = new Symbol('t')
const y_ = new Symbol('y')

// dy/dt = y  →  y = Ce^t
const ode1 = new Add(diff(y_, t), createNeg(y_))
console.log('Solve dy/dt = y')
const odeSol1 = dsolve(ode1, y_)
console.log('General solution:', odeSol1?.general.toString())
console.log('Method:', odeSol1?.method)

console.log('\n// dy/dt = 2y  →  y = Ce^(2t)')
const ode2 = new Add(diff(y_, t), createNeg(new Mul(new Integer(2), y_)))
const odeSol2 = dsolve(ode2, y_)
console.log('General solution:', odeSol2?.general.toString())

console.log('\n// d²y/dt² + y = 0  →  y = C₁sin(t) + C₂cos(t)')
const ode3 = new Add(diff(y_, t, 2), y_)
const odeSol3 = dsolve(ode3, y_)
console.log('General solution:', odeSol3?.general.toString())

console.log('\n// dy/dt + ty = t  →  linear ODE')
const ode4 = new Add(diff(y_, t), new Mul(t, y_), createNeg(t))
const odeSol4 = dsolve(ode4, y_)
console.log('General solution:', odeSol4?.general.toString())