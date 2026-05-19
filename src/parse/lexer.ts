export type TokenType = 
  | 'NUMBER' 
  | 'IDENT' 
  | 'PLUS' 
  | 'MINUS' 
  | 'TIMES' 
  | 'DIV' 
  | 'POW' 
  | 'LPAREN' 
  | 'RPAREN' 
  | 'COMMA' 
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
  position: number
}

export class Lexer {
  private pos: number = 0
  private input: string = ''

  tokenize(input: string): Token[] {
    this.input = input
    this.pos = 0
    const tokens: Token[] = []

    while (this.pos < this.input.length) {
      this.skipWhitespace()
      if (this.pos >= this.input.length) break

      const char = this.input[this.pos]

      if (this.isDigit(char) || (char === '-' && this.isNextDigit())) {
        tokens.push(this.readNumber())
      } else if (this.isAlpha(char) || char === '_') {
        tokens.push(this.readIdent())
      } else {
        tokens.push(this.readOperator())
      }
    }

    tokens.push({ type: 'EOF' as TokenType, value: '', position: this.pos })
    return tokens
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++
    }
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char)
  }

  private isNextDigit(): boolean {
    const nextPos = this.pos + 1
    return nextPos < this.input.length && /[0-9]/.test(this.input[nextPos])
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z]/.test(char)
  }

  private readNumber(): Token {
    const start = this.pos
    let numStr = ''

    if (this.input[this.pos] === '-') {
      numStr += '-'
      this.pos++
    }

    while (this.pos < this.input.length && /[0-9]/.test(this.input[this.pos])) {
      numStr += this.input[this.pos]
      this.pos++
    }

    return { type: 'NUMBER' as TokenType, value: numStr, position: start }
  }

  private readIdent(): Token {
    const start = this.pos
    let ident = ''

    while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
      ident += this.input[this.pos]
      this.pos++
    }

    return { type: 'IDENT' as TokenType, value: ident, position: start }
  }

  private readOperator(): Token {
    const char = this.input[this.pos]
    const start = this.pos
    this.pos++

    switch (char) {
      case '+':
        return { type: 'PLUS' as TokenType, value: '+', position: start }
      case '-':
        return { type: 'MINUS' as TokenType, value: '-', position: start }
      case '*':
        return { type: 'TIMES' as TokenType, value: '*', position: start }
      case '/':
        return { type: 'DIV' as TokenType, value: '/', position: start }
      case '^':
        return { type: 'POW' as TokenType, value: '^', position: start }
      case '(':
        return { type: 'LPAREN' as TokenType, value: '(', position: start }
      case ')':
        return { type: 'RPAREN' as TokenType, value: ')', position: start }
      case ',':
        return { type: 'COMMA' as TokenType, value: ',', position: start }
      default:
        throw new Error(`Unexpected character: ${char} at position ${start}`)
    }
  }
}

export default Lexer