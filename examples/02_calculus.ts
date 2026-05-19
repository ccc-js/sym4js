import { Symbol, Integer, Add, Mul, Pow, Neg, Div, Sin, Cos, Exp, Log } from '../src/index.js'
import { diff, integrate, limit, series, summation } from '../src/index.js'

console.log('=== Differentiation ===\n')

const x = new Symbol('x')

// d/dx sin(x) = cos(x)
console.log('d/dx sin(x) =', diff(new Sin(x), x).toString())

// d/dx cos(x) = -sin(x)
console.log('d/dx cos(x) =', diff(new Cos(x), x).toString())

// d/dx x² = 2x
console.log('d/dx x² =', diff(new Pow(x, new Integer(2)), x).toString())

// d/dx e^x = e^x
console.log('d/dx e^x =', diff(new Exp(x), x).toString())

// d²/dx² x³ = 6x
console.log('d²/dx² x³ =', diff(new Pow(x, new Integer(3)), x, 2).toString())

console.log('\n=== Integration ===\n')

// ∫x² dx = x³/3
console.log('∫x² dx =', integrate(new Pow(x, new Integer(2)), x).toString())

// ∫sin(x) dx = -cos(x)
console.log('∫sin(x) dx =', integrate(new Sin(x), x).toString())

// ∫e^x dx = e^x
console.log('∫e^x dx =', integrate(new Exp(x), x).toString())

// ∫1/x dx = log(x)
console.log('∫1/x dx =', integrate(new Div(new Integer(1), x), x).toString())

console.log('\n=== Limits ===\n')

// lim x→0 sin(x)/x = 1
const limExpr = new Div(new Sin(x), x)
console.log('lim x→0 sin(x)/x =', limit(limExpr, x, new Integer(0)).toString())

// lim x→∞ 1/x = 0
const limExpr2 = new Div(new Integer(1), x)
console.log('lim x→∞ 1/x =', limit(limExpr2, x, new Symbol('inf')).toString())

// lim x→0 (e^x - 1)/x = 1
const limExpr3 = new Div(new Add(new Exp(x), new Neg(new Integer(1))), x)
console.log('lim x→0 (e^x-1)/x =', limit(limExpr3, x, new Integer(0)).toString())

console.log('\n=== Series Expansion ===\n')

// e^x = 1 + x + x²/2 + x³/6 + ...
const expSeries = series(new Exp(x), x, new Integer(0), 6)
console.log('e^x =', expSeries.toString())

// sin(x) = x - x³/6 + x⁵/120 - ...
const sinSeries = series(new Sin(x), x, new Integer(0), 6)
console.log('sin(x) =', sinSeries.toString())

// cos(x) = 1 - x²/2 + x⁴/24 - ...
const cosSeries = series(new Cos(x), x, new Integer(0), 6)
console.log('cos(x) =', cosSeries.toString())

console.log('\n=== Summation ===\n')

// Σk=1 to n k = n(n+1)/2
const k = new Symbol('k')
const n = new Symbol('n')
console.log('Σk=1 to n k =', summation(k, new Integer(1), n).toString())

// Σk=0 to 5 k² = 55
console.log('Σk=0 to 5 k² =', summation(new Pow(k, new Integer(2)), new Integer(0), new Integer(5)).toString())