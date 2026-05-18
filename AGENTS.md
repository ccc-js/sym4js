# AGENTS.md - Sym4JS 開發指南

## 專案概述

Sym4JS 是一個用 TypeScript 實作的符號數學函式庫，類似 Python 的 SymPy。

## 開發命令

```bash
# 安裝依賴
npm install

# 建置
npm run build

# 測試
npm run test:run    # 單次測試
npm test            # 監聽模式

# 程式碼品質
npm run lint        # ESLint + 自動修復
npm run format     # Prettier 格式化

# 檢查 (lint + typecheck)
npm run check
```

## 架構說明

### 核心模組 (src/core/expr.ts)

所有表達式類別都實作 `Expression` 介面:

```typescript
interface Expression {
  type: string
  args: Expression[]
  equals(other: Expression): boolean
  toJSON(): ExprJSON
  toString(): string
  clone(): Expression
  add/ sub/ mul/ div/ pow/ negate: (other: Expression) => Expression
}
```

主要類別:
- `Symbol` - 符號變數 (如 x, y, z)
- `Integer` - 大整數 (使用 BigInt)
- `Add` - 加法 (a + b)
- `Mul` - 乘法 (a * b)
- `Pow` - 乘冪 (a ** b)
- `Neg` - 負數 (-a)
- `Div` - 除法 (a / b)

### 運算模組 (src/operations/)

- `substitute.ts` - 符號替換
- `simplify.ts` - 表達式簡化

### 設計原則

1. **不可變性** - 所有操作返回新物件
2. **工廠函數** - 使用 `createAdd`, `createMul` 等工廠函數處理表達式建立
3. **扁平化** - `Add` 和 `Mul` 的 `flatten` 方法合併同類項
4. **符號索引** - 使用 `symbolKey()` 函數為表達式生成唯一索引

## 參考資源

- [SymPy 原始碼](https://github.com/sympy/sympy/tree/master/sympy)
  - `sympy/core/symbol.py` - Symbol 類別
  - `sympy/core/add.py` - Add 類別 (注意 flatten 方法)
  - `sympy/core/mul.py` - Mul 類別 (注意項合併邏輯)
  - `sympy/core/expr.py` - Expression 基類

## 待完成功能 (v0.2)

- [ ] 修復 `simplify(x+x)` 無限迴圈
- [ ] 實現 `expand` - 代數展開
- [ ] 實現 `factor` - 因式分解
- [ ] 實現 `diff` - 微分
- [ ] 添加三角函數支援 (sin, cos, tan)

## 程式碼規範

1. 所有路徑使用相對路徑
2. 超過 1000 行分成多個模組
3. 必須通過 lint 和類型檢查
4. 每個版本寫對應的 vX.Y.md 文件