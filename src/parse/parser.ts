import { Symbol, Integer, Add, Mul, Pow, Neg, Div, Expression } from '../core/expr.js'
import { Lexer, TokenType } from './lexer.js'
import { Sin, Cos, Tan, Cot, Sec, Csc, Sinh, Cosh, Tanh, Exp, Log } from '../functions/trig.js'
import { Gamma, Erf, Erfc, Psi } from '../functions/special.js'

export function parse(expr: string): Expression {
  const lexer = new Lexer()
  const tokens = lexer.tokenize(expr)
  const parser = new Parser(tokens)
  return parser.parse()
}

const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'sinh', 'cosh', 'tanh',
  'asin', 'acos', 'atan',
  'asinh', 'acosh', 'atanh',
  'exp', 'log', 'sqrt',
  'gamma', 'beta', 'erf', 'erfc', 'psi',
])

class Parser {
  private pos: number = 0
  private tokens: Array<{ type: TokenType; value: string; position: number }>

  constructor(tokens: Array<{ type: TokenType; value: string; position: number }>) {
    this.tokens = tokens
  }

  private current() {
    return this.tokens[this.pos]
  }

  private advance() {
    const token = this.current()
    this.pos++
    return token
  }

  private consume(type: TokenType) {
    if (this.current().type === type) {
      return this.advance()
    }
    throw new Error(`Expected ${type} but got ${this.current().type}`)
  }

  parse(): Expression {
    const result = this.parseExpression()
    if (this.current().type !== 'EOF') {
      throw new Error(`Unexpected token: ${this.current().value}`)
    }
    return result
  }

  parseExpression(): Expression {
    let left = this.parseTerm()

    while (this.current().type === 'PLUS' || this.current().type === 'MINUS') {
      const op = this.advance().type
      const right = this.parseTerm()
      if (op === 'PLUS') {
        left = new Add(left, right)
      } else {
        left = new Add(left, new Neg(right))
      }
    }

    return left
  }

  parseTerm(): Expression {
    let left = this.parseFactor()

    while (this.current().type === 'TIMES' || this.current().type === 'DIV') {
      const op = this.advance().type
      const right = this.parseFactor()
      if (op === 'TIMES') {
        left = new Mul(left, right)
      } else {
        left = new Div(left, right)
      }
    }

    return left
  }

  parseFactor(): Expression {
    const base = this.parsePrimary()

    if (this.current().type === 'POW') {
      this.advance()
      const exp = this.parsePrimary()
      return new Pow(base, exp)
    }

    return base
  }

  parsePrimary(): Expression {
    const token = this.current()

    if (token.type === 'NUMBER') {
      this.advance()
      return new Integer(token.value)
    }

    if (token.type === 'IDENT') {
      this.advance()

      if (this.current().type === 'LPAREN') {
        return this.parseFunction(token.value)
      }

      if (token.value === 'e') {
        return new Pow(new Symbol('e'), new Integer(1))
      }
      if (token.value === 'pi' || token.value === 'PI') {
        return new Symbol('pi')
      }

      return new Symbol(token.value)
    }

    if (token.type === 'MINUS') {
      this.advance()
      const expr = this.parsePrimary()
      return new Neg(expr)
    }

    if (token.type === 'LPAREN') {
      this.advance()
      const expr = this.parseExpression()
      this.consume('RPAREN')
      return expr
    }

    throw new Error(`Unexpected token: ${token.value}`)
  }

  private parseFunction(name: string): Expression {
    this.consume('LPAREN')
    const args: Expression[] = []

    if (this.current().type !== 'RPAREN') {
      args.push(this.parseExpression())

      while (this.current().type === 'COMMA') {
        this.advance()
        args.push(this.parseExpression())
      }
    }

    this.consume('RPAREN')

    const lowerName = name.toLowerCase()
    if (FUNCTIONS.has(lowerName)) {
      return this.createFunctionCall(lowerName, args)
    }

    return new Symbol(name)
  }

  private createFunctionCall(name: string, args: Expression[]): Expression {
    switch (name) {
      case 'sin': return new Sin(args[0])
      case 'cos': return new Cos(args[0])
      case 'tan': return new Tan(args[0])
      case 'cot': return new Cot(args[0])
      case 'sec': return new Sec(args[0])
      case 'csc': return new Csc(args[0])
      case 'sinh': return new Sinh(args[0])
      case 'cosh': return new Cosh(args[0])
      case 'tanh': return new Tanh(args[0])
      case 'exp': return new Exp(args[0])
      case 'log': return new Log(args[0])
      case 'gamma': return new Gamma(args[0])
      case 'erf': return new Erf(args[0])
      case 'erfc': return new Erfc(args[0])
      case 'psi': return new Psi(args[0])
      default:
        return new Symbol(`${name}(${args.map(a => a.toString()).join(', ')})`)
    }
  }
}

export default { parse }