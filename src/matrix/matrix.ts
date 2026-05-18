import { Integer, Expression, Zero, One } from '../core/expr.js'

export class Matrix {
  readonly rows: number
  readonly cols: number
  private data: Expression[][]

  constructor(data: Expression[][]) {
    if (data.length === 0 || data[0].length === 0) {
      throw new Error('Matrix cannot be empty')
    }
    this.rows = data.length
    this.cols = data[0].length
    this.data = data.map(row => [...row])
  }

  get(row: number, col: number): Expression {
    return this.data[row][col]
  }

  set(row: number, col: number, value: Expression): void {
    this.data[row][col] = value
  }

  add(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for addition')
    }
    const result: Expression[][] = []
    for (let i = 0; i < this.rows; i++) {
      const row: Expression[] = []
      for (let j = 0; j < this.cols; j++) {
        row.push(this.data[i][j].add(other.data[i][j]))
      }
      result.push(row)
    }
    return new Matrix(result)
  }

  sub(other: Matrix): Matrix {
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error('Matrix dimensions must match for subtraction')
    }
    const result: Expression[][] = []
    for (let i = 0; i < this.rows; i++) {
      const row: Expression[] = []
      for (let j = 0; j < this.cols; j++) {
        row.push(this.data[i][j].sub(other.data[i][j]))
      }
      result.push(row)
    }
    return new Matrix(result)
  }

  mul(other: Matrix): Matrix {
    if (this.cols !== other.rows) {
      throw new Error('Matrix dimensions incompatible for multiplication')
    }
    const result: Expression[][] = []
    for (let i = 0; i < this.rows; i++) {
      const row: Expression[] = []
      for (let j = 0; j < other.cols; j++) {
        let sum: Expression = Zero
        for (let k = 0; k < this.cols; k++) {
          sum = sum.add(this.data[i][k].mul(other.data[k][j]))
        }
        row.push(sum)
      }
      result.push(row)
    }
    return new Matrix(result)
  }

  scale(scalar: Expression): Matrix {
    const result: Expression[][] = []
    for (let i = 0; i < this.rows; i++) {
      const row: Expression[] = []
      for (let j = 0; j < this.cols; j++) {
        row.push(this.data[i][j].mul(scalar))
      }
      result.push(row)
    }
    return new Matrix(result)
  }

  transpose(): Matrix {
    const result: Expression[][] = []
    for (let j = 0; j < this.cols; j++) {
      const row: Expression[] = []
      for (let i = 0; i < this.rows; i++) {
        row.push(this.data[i][j])
      }
      result.push(row)
    }
    return new Matrix(result)
  }

  det(): Expression {
    if (this.rows !== this.cols) {
      throw new Error('Determinant only defined for square matrices')
    }
    return this.determinant(this.data)
  }

  private determinant(mat: Expression[][]): Expression {
    const n = mat.length
    if (n === 1) {
      return mat[0][0]
    }
    if (n === 2) {
      return mat[0][0].mul(mat[1][1]).sub(mat[0][1].mul(mat[1][0]))
    }
    let result: Expression = Zero
    for (let j = 0; j < n; j++) {
      const minor = this.getMinor(mat, 0, j)
      let cofactor = this.determinant(minor)
      if (j % 2 === 1) {
        cofactor = cofactor.negate()
      }
      result = result.add(mat[0][j].mul(cofactor))
    }
    return result
  }

  private getMinor(mat: Expression[][], row: number, col: number): Expression[][] {
    const result: Expression[][] = []
    for (let i = 0; i < mat.length; i++) {
      if (i === row) continue
      const newRow: Expression[] = []
      for (let j = 0; j < mat[i].length; j++) {
        if (j === col) continue
        newRow.push(mat[i][j])
      }
      result.push(newRow)
    }
    return result
  }

  inv(): Matrix | null {
    if (this.rows !== this.cols) {
      throw new Error('Inverse only defined for square matrices')
    }
    const n = this.rows
    const det = this.det()
    if (det.type === 'integer' && (det as Integer).value === 0n) {
      return null
    }
    if (n === 1) {
      return new Matrix([[det.div(new Integer(1))]])
    }
    const adj: Expression[][] = []
    for (let i = 0; i < n; i++) {
      const row: Expression[] = []
      for (let j = 0; j < n; j++) {
        const minor = this.getMinor(this.data, i, j)
        let cofactor = this.determinant(minor)
        if ((i + j) % 2 === 1) {
          cofactor = cofactor.negate()
        }
        row.push(cofactor)
      }
      adj.push(row)
    }
    const adjMatrix = new Matrix(adj)
    return adjMatrix.transpose().scale(det.div(new Integer(1)))
  }

  toString(): string {
    const rows = this.data.map(row =>
      '[' + row.map(el => el.toString()).join(', ') + ']'
    )
    return '[' + rows.join(',\n ') + ']'
  }

  clone(): Matrix {
    return new Matrix(this.data.map(row => row.map(el => el.clone())))
  }

  static identity(n: number): Matrix {
    const data: Expression[][] = []
    for (let i = 0; i < n; i++) {
      const row: Expression[] = []
      for (let j = 0; j < n; j++) {
        row.push(i === j ? One : Zero)
      }
      data.push(row)
    }
    return new Matrix(data)
  }

  static zeros(rows: number, cols: number): Matrix {
    const data: Expression[][] = []
    for (let i = 0; i < rows; i++) {
      const row: Expression[] = []
      for (let j = 0; j < cols; j++) {
        row.push(Zero)
      }
      data.push(row)
    }
    return new Matrix(data)
  }
}

export default Matrix