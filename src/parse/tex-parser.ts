import { Symbol, Integer, Add, Mul, Pow, Neg, Div, Expression } from '../core/expr.js'
import { Sin, Cos, Tan, Cot, Sec, Csc, Sinh, Cosh, Tanh, Exp, Log } from '../functions/trig.js'
import { Gamma, Erf, Psi } from '../functions/special.js'

export function texParse(latex: string): Expression {
  const tokens = tokenize(latex)
  const parser = new TexParser(tokens)
  return parser.parse()
}

type TexTokenType = 'NUMBER' | 'IDENT' | 'PLUS' | 'MINUS' | 'TIMES' | 'DIV' | 'LPAREN' | 'RPAREN' | 'LBRACE' | 'RBRACE' | 'BACKSLASH' | 'CARET' | 'UNDERSCORE' | 'EOF'

interface TexToken {
  type: TexTokenType
  value: string
  position: number
}

function tokenize(latex: string): TexToken[] {
  const tokens: TexToken[] = []
  let pos = 0

  while (pos < latex.length) {
    const char = latex[pos]

    if (/\s/.test(char)) {
      pos++
      continue
    }

    if (/[0-9]/.test(char)) {
      let num = ''
      while (pos < latex.length && /[0-9]/.test(latex[pos])) {
        num += latex[pos++]
      }
      tokens.push({ type: 'NUMBER', value: num, position: pos })
      continue
    }

    if (char === '\\') {
      let cmd = '\\'
      pos++
      while (pos < latex.length && /[a-zA-Z]/.test(latex[pos])) {
        cmd += latex[pos++]
      }
      tokens.push({ type: 'IDENT', value: cmd, position: pos })
      continue
    }

    if (/[a-zA-Z]/.test(char)) {
      let ident = ''
      while (pos < latex.length && /[a-zA-Z0-9]/.test(latex[pos])) {
        ident += latex[pos++]
      }
      tokens.push({ type: 'IDENT', value: ident, position: pos })
      continue
    }

    switch (char) {
      case '+': tokens.push({ type: 'PLUS', value: '+', position: pos }); break
      case '-': tokens.push({ type: 'MINUS', value: '-', position: pos }); break
      case '*': tokens.push({ type: 'TIMES', value: '*', position: pos }); break
      case '/': tokens.push({ type: 'DIV', value: '/', position: pos }); break
      case '(': tokens.push({ type: 'LPAREN', value: '(', position: pos }); break
      case ')': tokens.push({ type: 'RPAREN', value: ')', position: pos }); break
      case '{': tokens.push({ type: 'LBRACE', value: '{', position: pos }); break
      case '}': tokens.push({ type: 'RBRACE', value: '}', position: pos }); break
      case '^': tokens.push({ type: 'CARET', value: '^', position: pos }); break
      case '_': tokens.push({ type: 'UNDERSCORE', value: '_', position: pos }); break
      default: throw new Error(`Unexpected character: ${char} at position ${pos}`)
    }
    pos++
  }

  tokens.push({ type: 'EOF', value: '', position: pos })
  return tokens
}

class TexParser {
  private pos: number = 0
  private tokens: TexToken[]

  constructor(tokens: TexToken[]) {
    this.tokens = tokens
  }

  private current() {
    return this.tokens[this.pos]
  }

  private advance() {
    return this.tokens[this.pos++]
  }

  private peek(): TexToken {
    return this.tokens[this.pos]
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

    // Handle implicit multiplication: xy -> x*y
    while (this.current().type === 'IDENT' || this.current().type === 'LBRACE' || this.current().type === 'LPAREN' || 
           (this.current().type === 'MINUS' && this.peek().type === 'IDENT')) {
      const right = this.parseFactor()
      left = new Mul(left, right)
    }

    return left
  }

  parseFactor(): Expression {
    const token = this.current()

    if (token.type === 'NUMBER') {
      this.advance()
      return new Integer(token.value)
    }

    if (token.type === 'IDENT') {
      this.advance()
      return this.parseIdent(token.value)
    }

    if (token.type === 'MINUS') {
      this.advance()
      const expr = this.parseFactor()
      return new Neg(expr)
    }

    if (token.type === 'LPAREN') {
      this.advance()
      const expr = this.parseExpression()
      if (this.current().type === 'RPAREN') {
        this.advance()
      }
      return expr
    }

    if (token.type === 'LBRACE') {
      this.advance()
      const expr = this.parseExpression()
      if (this.current().type === 'RBRACE') {
        this.advance()
      }
      return expr
    }

    throw new Error(`Unexpected token: ${token.value}`)
  }

  private parseIdent(value: string): Expression {
    // Check for \frac{a}{b}
    if (value === '\\frac' || value === 'frac') {
      const num = this.parsePrimary()
      const den = this.parsePrimary()
      return new Div(num, den)
    }

    // Check for \sqrt{x}
    if (value === '\\sqrt' || value === 'sqrt') {
      const arg = this.parsePrimary()
      return new Pow(arg, new Div(new Integer(1), new Integer(2)))
    }

    // Check for \sin, \cos, etc.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const funcMap: Record<string, any> = {
      '\\sin': Sin, 'sin': Sin,
      '\\cos': Cos, 'cos': Cos,
      '\\tan': Tan, 'tan': Tan,
      '\\cot': Cot, 'cot': Cot,
      '\\sec': Sec, 'sec': Sec,
      '\\csc': Csc, 'csc': Csc,
      '\\sinh': Sinh, 'sinh': Sinh,
      '\\cosh': Cosh, 'cosh': Cosh,
      '\\tanh': Tanh, 'tanh': Tanh,
      '\\exp': Exp, 'exp': Exp,
      '\\log': Log, 'log': Log,
      '\\gamma': Gamma, 'gamma': Gamma,
      '\\erf': Erf, 'erf': Erf,
      '\\psi': Psi, 'psi': Psi,
    }

    if (funcMap[value]) {
      const arg = this.parsePrimary()
      return new funcMap[value](arg)
    }

    // Check for ^ after identifier
    if (this.current().type === 'CARET') {
      this.advance()
      const exp = this.parsePrimary()
      return new Pow(new Symbol(value.replace(/^\\/, '')), exp)
    }

    // Check for _ (subscript)
    if (this.current().type === 'UNDERSCORE') {
      this.advance()
      const sub = this.parsePrimary()
      return new Symbol(`${value.replace(/^\\/, '')}_${sub.toString()}`)
    }

    // Check for direct parenthesis after function name
    if (this.current().type === 'LPAREN') {
      const arg = this.parsePrimary()
      if (funcMap[value]) {
        return new funcMap[value](arg)
      }
      return new Symbol(value)
    }

    // Regular symbol
    return new Symbol(value.replace(/^\\/, ''))
  }

  private parsePrimary(): Expression {
    const token = this.current()

    if (token.type === 'NUMBER') {
      this.advance()
      return new Integer(token.value)
    }

    if (token.type === 'IDENT') {
      this.advance()
      return this.parseIdent(token.value)
    }

    if (token.type === 'MINUS') {
      this.advance()
      return new Neg(this.parsePrimary())
    }

    if (token.type === 'LPAREN') {
      this.advance()
      const expr = this.parseExpression()
      if (this.current().type === 'RPAREN') {
        this.advance()
      }
      return expr
    }

    if (token.type === 'LBRACE') {
      this.advance()
      const expr = this.parseExpression()
      if (this.current().type === 'RBRACE') {
        this.advance()
      }
      return expr
    }

    throw new Error(`Unexpected token: ${token.value}`)
  }
}

export default { texParse }