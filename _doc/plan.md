# Sym4JS - TypeScript 符號數學函式庫規劃

* 架構參考
  * https://github.com/sympy/sympy/tree/master/sympy
  * 

## 1. 專案目標

建立一個類似 Python SymPy 的 TypeScript 符號數學庫，支援符號表達式運算、代數操作、微積分、方程求解等功能。

## 2. 核心模組架構

```
sym4js/
├── src/
│   ├── core/
│   │   ├── symbol.ts      # 符號定義與符號表
│   │   ├── expr.ts        # 表達式基類
│   │   └── types.ts       # 型別定義
│   ├── ast/
│   │   ├── add.ts         # 加法節點
│   │   ├── mul.ts         # 乘法節點
│   │   ├── pow.ts         # 乘冪節點
│   │   └── basic.ts       # 基本節點類別
│   ├── operations/
│   │   ├── simplify.ts    # 簡化運算
│   │   ├── expand.ts      # 展開運算
│   │   ├── factor.ts      # 因式分解
│   │   └── substitute.ts  # 替換運算
│   ├── calculus/
│   │   ├── diff.ts        # 微分
│   │   ├── integrate.ts   # 積分
│   │   └── limit.ts       # 極限
│   ├── solvers/
│   │   ├── solve.ts       # 代數求解
│   │   └── ode.ts         # 微分方程
│   ├── functions/
│   │   ├── elementary.ts  # 基本函數 (sin, cos, exp, log, ...)
│   │   └── special.ts     # 特殊函數
│   └── index.ts           # 統一導出
├── tests/
│   └── *.test.ts          # 單元測試
├── _doc/
│   ├── v0.1.md            # 初始版本
│   └── plan.md            # 本規劃文件
└── package.json
```

## 3. 核心資料結構

### 3.1 Symbol (符號)
```typescript
class Symbol {
  name: string
  assumptions: Map<string, boolean>
}
```

### 3.2 Expression (表達式)
- `Add`: 加法 `a + b`
- `Mul`: 乘法 `a * b`
- `Pow`: 乘冪 `a ** b`
- `Symbol`: 符號變數
- `Integer` / `Float`: 數值
- `Function`: 函數應用

### 3.3 JSON 序列化格式
```json
{
  "type": "add",
  "args": [
    { "type": "symbol", "name": "x" },
    { "type": "integer", "value": 1 }
  ]
}
```

## 4. 功能規劃

### Phase 1 - v0.1 (核心基礎)
- [ ] Symbol 類別建立
- [ ] 基本表達式類別 (Add, Mul, Pow)
- [ ] 四則運算 (+, -, *, /, **)
- [ ] 簡易化簡 (simplify)
- [ ] 替換操作 (substitute)

### Phase 2 - v0.2 (代數運算)
- [ ] 展開運算 (expand)
- [ ] 因式分解 (factor)
- [ ] 代數式展開/合併
- [ ] 多項式運算

### Phase 3 - v0.3 (微積分)
- [ ] 微分 (diff/derivative)
- [ ] 積分 (integrate)
- [ ] 極限 (limit)

### Phase 4 - v0.4 (方程求解)
- [ ] 代數方程求解 (solve)
- [ ] 線性方程組
- [ ] 基本微分方程

### Phase 5 - v0.5 (函數與進階)
- [ ] 初等函數 (三角、指数、對數)
- [ ] 矩陣運算
- [ ] 級數展開

## 5. 技術規範

- **語言**: TypeScript (strict mode)
- **模組**: ESM (ES2022)
- **測試**: Vitest
- **lint**: ESLint + Prettier
- **最低 Node.js 版本**: 18+
- **序列化**: JSON 相容格式

## 6. 設計原則

1. **不可變性**: 所有表達式操作返回新物件
2. **類別繼承**: 統一 Expression 介面
3. **懶惰求值**: 支援符號表達式延遲計算
4. **可序列化**: 完整 JSON 序列化/反序列化
5. **鏈式 API**: Fluent interface 設計

## 7. 使用範例

```typescript
import { Symbol, simplify, diff, integrate } from 'sym4js'

const x = new Symbol('x')
const expr = (x ** 2 + 2 * x + 1) / (x + 1)
console.log(simplify(expr))  // x + 1

const expr2 = x ** 2
console.log(diff(expr2, x))  // 2*x

console.log(integrate(x ** 2, x))  // x**3/3
```

## 8. 參考文獻

- [SymPy Documentation](https://docs.sympy.org/)
- [Computer Algebra System](https://en.wikipedia.org/wiki/Computer_algebra_system)