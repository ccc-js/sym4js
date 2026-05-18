export type ExprType = string

export interface ExprJSON {
  type: string
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