# Bug 列表

---

## Bug #1: simplify(x+x) 無限迴圈 ✅ 已修復

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
`src/core/expr.ts:412` 的 `Mul.flatten()` 把 numeric coefficient 誤傳進因子合併邏輯，導致 `2*x` 在重建時被錯誤膨脹成更高次方，`simplify()` 因此無法收斂。

**修復方式**:
讓係數只累積在 `coeff` 變數，不再影響符號因子的 exponent。

**驗證**:
```bash
node reproduce_bug.js
# 輸出: Result: 2*x
```

**相關檔案**:
- `src/core/expr.ts` - Mul.flatten