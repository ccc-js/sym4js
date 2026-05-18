export type ExprType = 'symbol' | 'integer' | 'add' | 'mul' | 'pow' | 'neg' | 'div'

export interface ExprJSON {
  type: ExprType
  args?: unknown[]
  name?: string
  value?: string | number
  base?: unknown
  exp?: unknown
}

export interface Substitution {
  variable: { name: string }
  value: unknown
}