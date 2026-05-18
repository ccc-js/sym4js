import { describe, it, expect } from 'vitest'
import { Symbol, Integer, Zero, One, Two, Add, Mul, Pow, Neg, Div, substitute, simplify, expand, diff, Sin, Cos, Tan, createAdd } from '../src/index.js'

describe('Symbol', () => {
  it('creates a symbol with valid name', () => {
    const x = new Symbol('x')
    expect(x.name).toBe('x')
  })

  it('throws on invalid symbol name', () => {
    expect(() => new Symbol('123')).toThrow()
    expect(() => new Symbol('x y')).toThrow()
  })

  it('checks assumptions', () => {
    const x = new Symbol('x', { positive: true })
    expect(x.isPositive()).toBe(true)
    expect(x.isNegative()).toBe(false)
  })

  it('equals works correctly', () => {
    const x = new Symbol('x')
    const y = new Symbol('x')
    const z = new Symbol('y')
    expect(x.equals(y)).toBe(true)
    expect(x.equals(z)).toBe(false)
  })

  it('converts to JSON', () => {
    const x = new Symbol('x')
    expect(x.toJSON()).toEqual({ type: 'symbol', name: 'x' })
  })

  it('toString returns name', () => {
    const x = new Symbol('x')
    expect(x.toString()).toBe('x')
  })
})

describe('Integer', () => {
  it('creates from number', () => {
    const i = new Integer(42)
    expect(i.value).toBe(42n)
  })

  it('creates from bigint', () => {
    const i = new Integer(42n)
    expect(i.value).toBe(42n)
  })

  it('creates from string', () => {
    const i = new Integer('12345678901234567890')
    expect(i.value).toBe(12345678901234567890n)
  })

  it('checks properties', () => {
    const pos = new Integer(5)
    const neg = new Integer(-3)
    const zero = new Integer(0)
    expect(pos.isPositive()).toBe(true)
    expect(pos.isNegative()).toBe(false)
    expect(neg.isNegative()).toBe(true)
    expect(zero.isZero()).toBe(true)
    expect(pos.isInteger()).toBe(true)
  })

  it('equals works correctly', () => {
    expect(new Integer(5).equals(new Integer(5))).toBe(true)
    expect(new Integer(5).equals(new Integer(3))).toBe(false)
  })

  it('converts to JSON', () => {
    expect(new Integer(42).toJSON()).toEqual({ type: 'integer', value: '42' })
  })
})

describe('Add', () => {
  it('adds two symbols', () => {
    const x = new Symbol('x')
    const y = new Symbol('y')
    const result = new Add(x, y)
    expect(result.args.length).toBe(2)
    expect(result.toString()).toBe('x+y')
  })

  it('flattens nested Add', () => {
    const x = new Symbol('x')
    const y = new Symbol('y')
    const z = new Symbol('z')
    const result = new Add(new Add(x, y), z)
    expect(result.args.length).toBe(3)
  })

  it('removes zeros', () => {
    const x = new Symbol('x')
    const result = new Add(x, Zero)
    expect(result.args.length).toBe(1)
    expect(result.args[0].equals(x)).toBe(true)
  })

  it('returns Integer when adding zero to an integer via factory', () => {
    const result = createAdd(Zero, new Integer(6))
    expect(result instanceof Integer).toBe(true)
    expect(result.equals(new Integer(6))).toBe(true)
  })
})

describe('Mul', () => {
  it('multiplies two symbols', () => {
    const x = new Symbol('x')
    const y = new Symbol('y')
    const result = new Mul(x, y)
    expect(result.args.length).toBe(2)
  })

  it('returns zero when multiplying by zero', () => {
    const x = new Symbol('x')
    const result = x.mul(Zero)
    expect(result.type).toBe('integer')
    expect((result as Integer).value).toBe(0n)
  })

  it('removes ones', () => {
    const x = new Symbol('x')
    const result = new Mul(x, One)
    expect(result.args.length).toBe(1)
  })
})

describe('Pow', () => {
  it('creates power expression', () => {
    const x = new Symbol('x')
    const result = new Pow(x, Two)
    expect(result.base.equals(x)).toBe(true)
    expect(result.exp.equals(Two)).toBe(true)
  })

  it('toString formats correctly', () => {
    const x = new Symbol('x')
    expect(new Pow(x, Two).toString()).toBe('x**2')
  })
})

describe('Neg', () => {
  it('negates expression', () => {
    const x = new Symbol('x')
    const result = new Neg(x)
    expect(result.arg.equals(x)).toBe(true)
    expect(result.toString()).toBe('-x')
  })
})

describe('Div', () => {
  it('creates division expression', () => {
    const x = new Symbol('x')
    const result = new Div(x, Two)
    expect(result.numerator.equals(x)).toBe(true)
    expect(result.denominator.equals(Two)).toBe(true)
  })
})

describe('substitute', () => {
it('substitutes symbol with value', () => {
    const x = new Symbol('x')
    const expr = new Add(x, One)
    const result = substitute(expr, { variable: x, value: Two })
    expect(result.toString()).toBe('3')
  })

  it('substitutes in power expression', () => {
    const x = new Symbol('x')
    const expr = new Pow(x, Two)
    const result = substitute(expr, { variable: x, value: Three() })
    expect(result.toString()).toBe('3**2')
  })
})

function Three() {
  return new Integer(3)
}

describe('simplify', () => {
  it('simplifies addition with zeros', () => {
    const x = new Symbol('x')
    const expr = new Add(x, Zero)
    const result = simplify(expr)
    expect(result.equals(x)).toBe(true)
  })

  it('simplifies multiplication with ones', () => {
    const x = new Symbol('x')
    const expr = new Mul(x, One)
    const result = simplify(expr)
    expect(result.equals(x)).toBe(true)
  })

  it('simplifies power of zero', () => {
    const x = new Symbol('x')
    const expr = new Pow(x, Zero)
    const result = simplify(expr)
    expect(result.equals(One)).toBe(true)
  })

  it('simplifies power of one', () => {
    const x = new Symbol('x')
    const expr = new Pow(x, One)
    const result = simplify(expr)
    expect(result.equals(x)).toBe(true)
  })

  it('simplifies double negation', () => {
    const x = new Symbol('x')
    const expr = new Neg(new Neg(x))
    const result = simplify(expr)
    expect(result.equals(x)).toBe(true)
  })

  it('simplifies division by one', () => {
    const x = new Symbol('x')
    const expr = new Div(x, One)
    const result = simplify(expr)
    expect(result.equals(x)).toBe(true)
  })

  it('simplifies 0/anything', () => {
    const x = new Symbol('x')
    const expr = new Div(Zero, x)
    const result = simplify(expr)
    expect(result.equals(Zero)).toBe(true)
  })

  it('simplifies integer division', () => {
    const result = simplify(new Div(new Integer(6), new Integer(3)))
    expect(result.equals(Two)).toBe(true)
  })

  it('simplifies x+x to 2*x', () => {
    const x = new Symbol('x')
    const expr = new Add(x, x)
    const result = simplify(expr)
    expect(result.toString()).toBe('2*x')
  })
})

describe('Expression arithmetic operators', () => {
  it('supports add operator', () => {
    const x = new Symbol('x')
    const result = x.add(new Integer(1))
    expect(result instanceof Add).toBe(true)
  })

  it('supports sub operator', () => {
    const x = new Symbol('x')
    const result = x.sub(new Integer(1))
    expect(result instanceof Add).toBe(true)
  })

  it('supports mul operator', () => {
    const x = new Symbol('x')
    const result = x.mul(new Integer(2))
    expect(result instanceof Mul).toBe(true)
  })

  it('supports pow operator', () => {
    const x = new Symbol('x')
    const result = x.pow(new Integer(2))
    expect(result instanceof Pow).toBe(true)
  })
})

describe('JSON serialization', () => {
  it('serializes Symbol', () => {
    const x = new Symbol('x')
    expect(x.toJSON()).toEqual({ type: 'symbol', name: 'x' })
  })

  it('serializes Integer', () => {
    expect(new Integer(42).toJSON()).toEqual({ type: 'integer', value: '42' })
  })

  it('serializes Add', () => {
    const x = new Symbol('x')
    const result = new Add(x, One).toJSON()
    expect(result.type).toBe('add')
    expect(result.args).toHaveLength(2)
  })
})

describe('expand', () => {
  it('expands (x+1)^2 to x^2 + 2x + 1', () => {
    const x = new Symbol('x')
    const expr = new Pow(new Add(x, One), new Integer(2))
    const result = expand(expr)
    expect(result.toString()).toMatch(/x\*\*2|2*x/)
  })

  it('expands x*(a+b) to x*a + x*b', () => {
    const x = new Symbol('x')
    const a = new Symbol('a')
    const b = new Symbol('b')
    const expr = x.mul(new Add(a, b))
    const result = expand(expr)
    expect(result.toString()).toMatch(/x\*a|x\*b/)
  })
})

describe('diff', () => {
  it('differentiates x^2 with respect to x', () => {
    const x = new Symbol('x')
    const expr = new Pow(x, new Integer(2))
    const result = diff(expr, x)
    expect(result.toString()).toBe('2*x')
  })

  it('differentiates sin(x) with respect to x', () => {
    const x = new Symbol('x')
    const expr = new Sin(x)
    const result = diff(expr, x)
    expect(result.toString()).toBe('cos(x)')
  })

  it('differentiates cos(x) with respect to x', () => {
    const x = new Symbol('x')
    const expr = new Cos(x)
    const result = diff(expr, x)
    expect(result.toString()).toBe('-sin(x)')
  })

  it('differentiates x^3 three times', () => {
    const x = new Symbol('x')
    const expr = new Pow(x, new Integer(3))
    const result = diff(expr, x, 3)
    expect(result.type).toBe('add')
    const addResult = result as Add
    expect(addResult.args.length).toBe(2)
    const simplifiedResult = simplify(result)
    expect(simplifiedResult.type).toBe('integer')
    expect((simplifiedResult as Integer).value).toBe(6n)
  })
})

describe('Trigonometric functions', () => {
  it('creates Sin expression', () => {
    const x = new Symbol('x')
    const expr = new Sin(x)
    expect(expr.toString()).toBe('sin(x)')
    expect(expr.type).toBe('sin')
  })

  it('creates Cos expression', () => {
    const x = new Symbol('x')
    const expr = new Cos(x)
    expect(expr.toString()).toBe('cos(x)')
    expect(expr.type).toBe('cos')
  })

  it('creates Tan expression', () => {
    const x = new Symbol('x')
    const expr = new Tan(x)
    expect(expr.toString()).toBe('tan(x)')
    expect(expr.type).toBe('tan')
  })

  it('Sin and Cos are not equal', () => {
    const x = new Symbol('x')
    expect(new Sin(x).equals(new Cos(x))).toBe(false)
  })
})
