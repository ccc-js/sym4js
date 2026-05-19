# Sym4JS

A symbolic mathematics library for JavaScript/TypeScript, inspired by Python's SymPy.

## Installation

```bash
npm install sym4js
```

## Features

### Core Expressions
- `Symbol`, `Integer`, `Add`, `Mul`, `Pow`, `Neg`, `Div`, `Zero`, `One`, `Two`

### Algebraic Operations
- `substitute` - Variable substitution
- `simplify` - Expression simplification
- `expand` - Algebraic expansion
- `factor` - Factorization

### Calculus
- `diff` - Differentiation (all functions)
- `integrate` - Integration
- `limit` - Limits
- `series`, `taylor`, `maclaurin` - Series expansion
- `summation` - Definite summation

### Equation Solving
- `solve` - Algebraic equations
- `solveLinearSystem` - Linear systems
- `dsolve` - Ordinary differential equations (ODE)
- `pdesolve` - Partial differential equations (PDE)

### Special Functions
- Trigonometric: `Sin`, `Cos`, `Tan`, `Cot`, `Sec`, `Csc`
- Inverse trig: `Asin`, `Acos`, `Atan`
- Hyperbolic: `Sinh`, `Cosh`, `Tanh`
- Inverse hyperbolic: `Asinh`, `Acosh`, `Atanh`
- Exponential: `Exp`, `Log`
- Special: `Gamma`, `Beta`, `Bessel`, `Legendre`, `Erf`, `Erfc`, `Psi`

### Linear Algebra
- `Matrix` - Matrix operations, determinant, inverse, LU/QR decomposition, eigenvalues, eigenvectors

### Polynomials
- `Poly` - Polynomial operations, GCD, LCM, roots, derivative, integral

### Tensors
- `Tensor` - Tensor operations, tensor product, contraction, transpose

### Numerical Evaluation
- `evaluate` - Evaluate symbolic expressions with numeric values

## Usage

```typescript
import {
  Symbol, Integer, Add, Mul, Pow, Neg,
  simplify, expand, factor, substitute,
  diff, integrate, limit, series,
  solve, solveLinearSystem, dsolve, pdesolve,
  Matrix, Poly, Tensor,
  Sin, Cos, Exp, Log, Gamma, Legendre, evaluate
} from 'sym4js'

const x = new Symbol('x')
const y = new Symbol('y')

// Basic arithmetic
const expr = new Add(new Mul(new Integer(2), new Pow(x, new Integer(2))), new Integer(8))
console.log(factor(expr).toString())  // 2*(x^2+4)

// Differentiation
console.log(diff(new Sin(x), x).toString())  // cos(x)

// Integration
console.log(integrate(new Pow(x, new Integer(2)), x).toString())  // x^3/3

// Solve equation
console.log(solve(new Add(new Pow(x, new Integer(2)), new Neg(new Integer(4)))), x)  // [2, -2]

// Series expansion
console.log(series(new Exp(x), x, new Integer(0), 6).toString())  // 1 + x + x^2/2 + x^3/6 + x^4/24 + x^5/120

// Limit
console.log(limit(new Sin(x).div(x), x, new Integer(0)).toString())  // 1

// Matrix
const { Matrix } = require('sym4js')
const m = new Matrix([[new Integer(1), new Integer(2)], [new Integer(3), new Integer(4)]])
console.log(m.det().toString())  // -2
console.log(m.inv().toString())  // -2  1 / 1.5  -0.5

// Numerical evaluation
const vars = new Map([[x, new Integer(2)]])
console.log(evaluate(new Pow(x, new Integer(3)), vars))  // 8
```

## API Reference

### Core Classes
| Class | Description |
|-------|-------------|
| `Symbol` | Symbolic variable (e.g., `x`, `y`, `z`) |
| `Integer` | Arbitrary precision integer (BigInt) |
| `Add` | Addition expression (`a + b`) |
| `Mul` | Multiplication expression (`a * b`) |
| `Pow` | Power expression (`a ** b`) |
| `Neg` | Negation (`-a`) |
| `Div` | Division (`a / b`) |

### Operations
| Function | Description |
|----------|-------------|
| `substitute(expr, old, new)` | Replace variables |
| `simplify(expr)` | Simplify expression |
| `expand(expr)` | Expand expression |
| `factor(expr)` | Factor expression |
| `diff(expr, var, order?)` | Differentiate (default order 1) |
| `integrate(expr, var)` | Integrate |
| `limit(expr, var, point)` | Compute limit |
| `series(expr, var, point?, order?)` | Series expansion (default order 5) |
| `taylor(expr, var, point, order)` | Taylor expansion |
| `maclaurin(expr, var, order)` | Maclaurin expansion (point = 0) |
| `solve(equation, var)` | Solve algebraic equation |
| `solveLinearSystem(eqs, vars)` | Solve linear system |
| `dsolve(equation, y, options?)` | Solve ODE |
| `pdesolve(equation, dependentVar, independentVars)` | Solve PDE |
| `evaluate(expr, vars)` | Numeric evaluation |

### ODE Options
```typescript
dsolve(equation, y, {
  initialConditions: Map<Symbol, Expression>,  // IVP
  boundaryConditions: { x0, y0, x1?, y1? },    // BVP
  constant?: Symbol                            // Custom constant symbol
})
```

### Matrix Methods
- `add()`, `sub()`, `mul()`, `scale()`
- `transpose()`, `det()`, `inv()`
- `lu()`, `qr()`
- `eigenvalues()`, `eigenvectors()`

### Poly Methods
- `add()`, `sub()`, `mul()`, `div()`, `mod()`
- `gcd()`, `lcm()`
- `roots()`, `rationalRoots()`, `newtonRaphson()`
- `derivative()`, `integral()`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm run test:run    # Single run
npm test            # Watch mode

# Lint
npm run lint

# Format
npm run format

# Check (lint + typecheck)
npm run check

# Publish (after npm login)
npm publish --access public
```

## License

MIT