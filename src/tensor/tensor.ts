

export class Tensor {
  readonly data: number[][]
  readonly shape: number[]
  readonly rank: number

  constructor(data: number[][], shape?: number[]) {
    if (shape === undefined) {
      this.shape = [data.length, data[0]?.length || 0]
    } else {
      this.shape = shape
    }

    this.rank = this.shape.length
    this.data = data.map(row => [...row])
  }

  get(...indices: number[]): number {
    if (indices.length !== this.rank) {
      throw new Error(`Expected ${this.rank} indices, got ${indices.length}`)
    }

    let result: number[] | number = this.data
    for (const idx of indices) {
      result = result[idx]
    }
    return result
  }

  set(value: number, ...indices: number[]): void {
    if (indices.length !== this.rank) {
      throw new Error(`Expected ${this.rank} indices, got ${indices.length}`)
    }

    let current: number[][] | number[] = this.data
    for (let i = 0; i < indices.length - 1; i++) {
      current = current[indices[i]]
    }
    current[indices[indices.length - 1]] = value
  }

  add(other: Tensor): Tensor {
    if (!this.sameShape(other)) {
      throw new Error('Tensors must have the same shape for addition')
    }

    const newData: number[][] = []
    for (let i = 0; i < this.data.length; i++) {
      const row: number[] = []
      for (let j = 0; j < this.data[i].length; j++) {
        row.push(this.data[i][j] + other.data[i][j])
      }
      newData.push(row)
    }

    return new Tensor(newData, [...this.shape])
  }

  sub(other: Tensor): Tensor {
    if (!this.sameShape(other)) {
      throw new Error('Tensors must have the same shape for subtraction')
    }

    const newData: number[][] = []
    for (let i = 0; i < this.data.length; i++) {
      const row: number[] = []
      for (let j = 0; j < this.data[i].length; j++) {
        row.push(this.data[i][j] - other.data[i][j])
      }
      newData.push(row)
    }

    return new Tensor(newData, [...this.shape])
  }

  scale(scalar: number): Tensor {
    const newData: number[][] = []
    for (let i = 0; i < this.data.length; i++) {
      const row: number[] = []
      for (let j = 0; j < this.data[i].length; j++) {
        row.push(this.data[i][j] * scalar)
      }
      newData.push(row)
    }

    return new Tensor(newData, [...this.shape])
  }

  tensorProduct(other: Tensor): Tensor {
    const newShape = [...this.shape, ...other.shape]
    const newData: number[][] = []

    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < other.data.length; j++) {
        newData.push([this.data[i][0], other.data[j][0]])
      }
    }

    return new Tensor(newData, newShape)
  }

  contract(index1: number, index2: number): number {
    if (index1 < 0 || index1 >= this.rank || index2 < 0 || index2 >= this.rank) {
      throw new Error('Invalid contraction indices')
    }

    if (this.shape[index1] !== this.shape[index2]) {
      throw new Error('Cannot contract indices of different sizes')
    }

    let result = 0
    const n = this.shape[index1]
    for (let i = 0; i < n; i++) {
      const indices = this.getIndicesForContract(i, index1, index2)
      result += this.get(...indices) as number
    }
    return result
  }

  private getIndicesForContract(diagonalVal: number, index1: number, index2: number): number[] {
    const indices: number[] = []
    for (let i = 0; i < this.rank; i++) {
      if (i === index1 || i === index2) {
        indices.push(diagonalVal)
      } else {
        indices.push(0)
      }
    }
    return indices
  }

  private sameShape(other: Tensor): boolean {
    if (this.rank !== other.rank) return false
    return this.shape.every((s, i) => s === other.shape[i])
  }

  transpose(): Tensor {
    if (this.rank !== 2) {
      throw new Error('Only 2D tensors can be transposed')
    }

    const newData: number[][] = []
    for (let j = 0; j < this.shape[1]; j++) {
      const row: number[] = []
      for (let i = 0; i < this.shape[0]; i++) {
        row.push(this.data[i][j])
      }
      newData.push(row)
    }

    return new Tensor(newData, [this.shape[1], this.shape[0]])
  }

  toString(): string {
    return JSON.stringify({
      shape: this.shape,
      rank: this.rank,
      data: this.data
    })
  }

  clone(): Tensor {
    return new Tensor(this.data.map(row => [...row]), [...this.shape])
  }

  static zeros(shape: number[]): Tensor {
    const data: number[][] = []
    for (let i = 0; i < shape[0]; i++) {
      const row: number[] = []
      for (let j = 0; j < (shape[1] || 0); j++) {
        row.push(0)
      }
      data.push(row)
    }
    return new Tensor(data, shape)
  }

  static identity(n: number): Tensor {
    const data: number[][] = []
    for (let i = 0; i < n; i++) {
      const row: number[] = []
      for (let j = 0; j < n; j++) {
        row.push(i === j ? 1 : 0)
      }
      data.push(row)
    }
    return new Tensor(data, [n, n])
  }
}

export default Tensor