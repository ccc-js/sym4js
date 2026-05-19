import { Symbol, Integer, Add, Mul, Pow, Neg, Div, Zero } from '../src/index.js'
import { Matrix } from '../src/index.js'
import { symbols } from '../src/index.js'

console.log('=== Matrix Creation ===\n')

const m1 = new Matrix([
  [new Integer(1), new Integer(2)],
  [new Integer(3), new Integer(4)]
])
console.log('m1 =')
console.log(m1.toString())

console.log('\n=== Matrix Operations ===\n')

// m1 + m1
const m2 = m1.add(m1)
console.log('m1 + m1 =')
console.log(m2.toString())

// 2 * m1
const m3 = m1.scale(new Integer(2))
console.log('2 * m1 =')
console.log(m3.toString())

// m1 * m1
const m4 = m1.mul(m1)
console.log('m1 * m1 =')
console.log(m4.toString())

console.log('\n=== Determinant & Inverse ===\n')

console.log('det(m1) =', m1.det().toString())
console.log('inv(m1) =')
console.log(m1.inv().toString())

console.log('\n=== LU & QR Decomposition ===\n')

const { L, U } = m1.lu()
console.log('LU decomposition:')
console.log('L =')
console.log(L.toString())
console.log('U =')
console.log(U.toString())

const { Q, R } = m1.qr()
console.log('\nQR decomposition:')
console.log('Q =')
console.log(Q.toString())
console.log('R =')
console.log(R.toString())

console.log('\n=== Eigenvalues ===\n')

const m5 = new Matrix([
  [new Integer(4), new Integer(2)],
  [new Integer(1), new Integer(3)]
])
console.log('m5 =')
console.log(m5.toString())
console.log('eigenvalues:', m5.eigenvalues().map(e => e.toString()))

console.log('\n=== Symbolic Matrix ===\n')

const [a, b, c, d] = symbols('a b c d')
const symM = new Matrix([
  [a, b],
  [c, d]
])
console.log('symM =')
console.log(symM.toString())
console.log('det(symM) =', symM.det().toString())