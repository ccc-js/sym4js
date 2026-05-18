#!/usr/bin/env node

/**
 * Bug Reproduction: simplify(x+x) infinite loop
 *
 * Run: node reproduce_bug.js
 *
 * Expected: Should output "2*x"
 * Actual: Infinite loop until stack overflow
 */

import { Symbol, Add, simplify } from './src/index.js'

const x = new Symbol('x')
console.log('Creating Add(x, x)...')
const expr = new Add(x, x)
console.log(`Expression: ${expr.toString()}`)
console.log('Calling simplify...')

try {
  const result = simplify(expr)
  console.log(`Result: ${result.toString()}`)
} catch (err) {
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)
  process.exit(1)
}