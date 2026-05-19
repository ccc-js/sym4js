import { Symbol, Integer, Add, Mul, Pow, Neg, Div, simplify, expand, factor } from '../src/index.js'

console.log('=== Basic Arithmetic ===\n')

const x = new Symbol('x')
const y = new Symbol('y')

// Expression: 2x² + 8
const expr = new Add(new Mul(new Integer(2), new Pow(x, new Integer(2))), new Integer(8))
console.log('Original:  ', expr.toString())
console.log('Expanded:  ', expand(expr).toString())
console.log('Factored:  ', factor(expr).toString())

console.log('\n=== Simplification ===\n')

const simplExpr = new Add(
  new Mul(new Integer(2), x),
  new Mul(new Integer(3), x),
  new Integer(5)
)
console.log('2x + 3x + 5 =', simplify(simplExpr).toString())

const fracExpr = new Div(new Add(x, x), new Integer(2))
console.log('(x+x)/2 =', simplify(fracExpr).toString())

console.log('\n=== Polynomial Operations ===\n')

const p1 = new Add(new Pow(x, new Integer(2)), new Mul(new Integer(3), x))
const p2 = new Add(x, new Integer(1))
console.log('p1 =', p1.toString())
console.log('p2 =', p2.toString())
console.log('p1 + p2 =', expand(new Add(p1, p2)).toString())
console.log('p1 * p2 =', expand(new Mul(p1, p2)).toString())
console.log('p1 / p2 =', expand(new Div(p1, p2)).toString())

console.log('\n=== Powers ===\n')

console.log('x * x =', simplify(new Mul(x, x)).toString())
console.log('(x²)³ =', simplify(new Pow(new Pow(x, new Integer(2)), new Integer(3))).toString())
console.log('x⁰ =', simplify(new Pow(x, new Integer(0))).toString())
console.log('x⁻¹ =', simplify(new Pow(x, new Integer(-1))).toString())