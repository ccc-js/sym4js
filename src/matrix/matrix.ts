import { Integer, Expression, Zero, One, Pow } from '../core/expr.js'

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

  lu(): { L: Matrix; U: Matrix } | null {
    if (this.rows !== this.cols) {
      return null
    }
    const n = this.rows
    const L: Expression[][] = []
    const U: Expression[][] = []

    for (let i = 0; i < n; i++) {
      L.push([])
      U.push([])
      for (let j = 0; j < n; j++) {
        L[i].push(Zero)
        U[i].push(Zero)
      }
      L[i][i] = One
    }

    for (let k = 0; k < n; k++) {
      for (let j = k; j < n; j++) {
        let sum: Expression = Zero
        for (let s = 0; s < k; s++) {
          sum = sum.add(L[k][s].mul(U[s][j]))
        }
        U[k][j] = this.data[k][j].sub(sum)
      }
      for (let i = k + 1; i < n; i++) {
        if (U[k][k].type === 'integer' && (U[k][k] as Integer).value === 0n) {
          return null
        }
        let sum: Expression = Zero
        for (let s = 0; s < k; s++) {
          sum = sum.add(L[i][s].mul(U[s][k]))
        }
        L[i][k] = this.data[i][k].sub(sum).div(U[k][k])
      }
    }

    return { L: new Matrix(L), U: new Matrix(U) }
  }

  qr(): { Q: Matrix; R: Matrix } | null {
    if (this.rows < this.cols) {
      return null
    }
    const m = this.rows
    const n = this.cols
    const Q: Expression[][] = []
    const R: Expression[][] = []

    for (let i = 0; i < m; i++) {
      Q.push([])
      for (let j = 0; j < n; j++) {
        Q[i].push(Zero)
      }
    }

    for (let j = 0; j < n; j++) {
      R.push([])
      for (let k = 0; k < n; k++) {
        R[j].push(Zero)
      }
    }

    for (let j = 0; j < n; j++) {
      const v: Expression[] = []
      for (let i = 0; i < m; i++) {
        v.push(this.data[i][j])
      }

      for (let k = 0; k < j; k++) {
        let dot: Expression = Zero
        for (let i = 0; i < m; i++) {
          dot = dot.add(Q[i][k].mul(this.data[i][j]))
        }
        R[k][j] = dot
        for (let i = 0; i < m; i++) {
          v[i] = v[i].sub(Q[i][k].mul(dot))
        }
      }

      let normSq: Expression = Zero
      for (let i = 0; i < m; i++) {
        normSq = normSq.add(v[i].mul(v[i]))
      }

      if (normSq.type === 'integer' && (normSq as Integer).value === 0n) {
        return null
      }

      R[j][j] = new Pow(normSq, new Integer(1).div(new Integer(2)))

      for (let i = 0; i < m; i++) {
        Q[i][j] = v[i].div(R[j][j])
      }

      for (let k = j + 1; k < n; k++) {
        R[j][k] = Zero
      }
    }

    return { Q: new Matrix(Q), R: new Matrix(R) }
  }

  eigenvalues(): Expression[] | null {
    if (this.rows !== this.cols || this.rows > 3) {
      return null
    }
    const n = this.rows

    if (n === 1) {
      return [this.data[0][0]]
    }

    if (n === 2) {
      const a = this.data[0][0]
      const b = this.data[0][1]
      const c = this.data[1][0]
      const d = this.data[1][1]

      const trace = a.add(d)
      const det = a.mul(d).sub(b.mul(c))

      const four = new Integer(4)
      const discriminant = trace.mul(trace).sub(four.mul(det))

      if (discriminant.type === 'integer') {
        const disc = (discriminant as Integer).value
        if (disc > 0n) {
          const sqrtDisc = this.integerSqrt(disc)
          if (sqrtDisc !== null) {
            const two = new Integer(2)
            const root1 = trace.add(new Integer(sqrtDisc)).div(two)
            const root2 = trace.sub(new Integer(sqrtDisc)).div(two)
            return [root1, root2]
          }
        } else if (disc === 0n) {
          return [trace.div(new Integer(2))]
        }
      }

      return null
    }

    if (n === 3) {
      const a = this.data[0][0]
      const b = this.data[0][1]
      const c = this.data[0][2]
      const d = this.data[1][0]
      const e = this.data[1][1]
      const f = this.data[1][2]
      const g = this.data[2][0]
      const h = this.data[2][1]
      const i = this.data[2][2]

      const A = a.negate()
      const B = a.mul(e).sub(b.mul(d)).add(e.negate()).add(i.negate())
      const C = a.mul(e.mul(i).sub(f.mul(h))).add(b.mul(d.mul(i).sub(f.mul(g)))).add(c.mul(d.mul(h).sub(e.mul(g))))

      if (A.type === 'integer' && B.type === 'integer' && C.type === 'integer') {
        return this.solveCubic(A as Integer, B as Integer, C as Integer)
      }
    }

    return null
  }

  private integerSqrt(n: bigint): bigint | null {
    if (n < 0n) return null
    if (n === 0n) return 0n
    let low = 0n
    let high = n
    while (low <= high) {
      const mid = (low + high) / 2n
      const sq = mid * mid
      if (sq === n) return mid
      if (sq < n) {
        low = mid + 1n
      } else {
        high = mid - 1n
      }
    }
    return null
  }

  private solveCubic(a: Integer, b: Integer, c: Integer): Expression[] | null {
    const A = a.value
    const B = b.value
    const C = c.value

    if (A === 0n) return null

    const discriminant = (B * B) / 4n - (A * A * A) / 27n

    if (discriminant > 0n) {
      const sqrtD = this.integerSqrt(discriminant)
      if (sqrtD === null) return null

      const temp1 = -B / (3n * A)
      const u = this.integerSqrt((A * A) / 3n)
      if (u === null) return null

      const acosArg = (3n * C) / (2n * A * u) - (B * B * B) / (27n * A * A * A)
      const acosVal = acosArg > 2n ? 2n : acosArg < -2n ? -2n : acosArg

      const theta = Math.acos(Number(acosVal))
      const root1 = new Integer(temp1).add(new Integer(u).mul(new Integer(Math.cos(theta / 3))))
      const root2 = new Integer(temp1).add(new Integer(u).mul(new Integer(Math.cos((theta + 2 * Math.PI) / 3))))
      const root3 = new Integer(temp1).add(new Integer(u).mul(new Integer(Math.cos((theta + 4 * Math.PI) / 3))))

      return [root1, root2, root3]
    } else if (discriminant === 0n) {
      const root = new Integer(-(B / (3n * A)))
      return [root, root.negate().div(new Integer(2))]
    }

    return null
  }
}

export default Matrix