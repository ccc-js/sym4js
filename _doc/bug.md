# Bug 列表

## Bug #1: simplify(x+x) 無限迴圈

**嚴重程度**: 高

**描述**:
呼叫 `simplify(x.add(x))` 或 `simplify(new Add(x, x))` 會導致無限迴圈，最終導致 stack overflow。

**錯誤訊息**:
```
RangeError: Maximum call stack size exceeded
    at Mul.buildResult (src/core/expr.ts:...)
    at Mul.flatten (src/core/expr.ts:...)
    at new Mul (src/core/expr.ts:...)
    at simplifyMul (src/operations/simplify.ts:...)
    at simplifyImpl (src/operations/simplify.ts:...)
    at simplify (src/operations/simplify.ts:...)
```

**根本原因**:
`Add` 類別的 `flatten` 方法在合併同類項時（如 `x+x`），會呼叫 `new Integer(sum).mul(rest)` 產生 `Mul(2, x)`。但當 `simplify` 處理這個 `Mul` 時，`simplifyMul` 會再次創建 `new Mul(...factors)`，由於 `factors` 只有一個元素，構造函數邏輯有問題導致不斷遞迴。

**預期行為**:
```typescript
const x = new Symbol('x')
const expr = new Add(x, x)
const result = simplify(expr)
console.log(result.toString()) // 預期輸出 "2*x"
```

**目前行為**:
無限期遞迴直到 stack overflow

**修復方向**:
1. 檢查 `Add.flatten` 的項合併邏輯，確保 `x+x` 正確產生 `Mul(2, x)`
2. 檢查 `simplifyMul` 如何處理 `Mul(2, x)`，避免重建新的 `Mul`
3. 借鏡 SymPy 的 `Add.flatten` 和 `Mul.flatten` 實作
   - SymPy 使用 `as_coeff_Mul()` 分離係數和項
   - 使用 `terms` dictionary 按 term key 合併係數

**相關檔案**:
- `src/core/expr.ts` - Add.flatten, Mul.flatten, Mul.buildResult
- `src/operations/simplify.ts` - simplifyMul

**參考**:
- [SymPy Add.flatten](https://github.com/sympy/sympy/blob/master/sympy/core/add.py)
- [SymPy Mul.flatten](https://github.com/sympy/sympy/blob/master/sympy/core/mul.py)