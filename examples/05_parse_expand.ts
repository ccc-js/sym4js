import { symbols, parse, expand, factor, texParse } from '../src/index.js'

console.log('=== symbols() ===')
const [x, y] = symbols('x y')
console.log('x, y created')

console.log('\n=== parse() ===')
console.log('x + 2*y =', parse('x + 2*y').toString())
console.log('(x + y)^2 =', parse('(x + y)^2').toString())
console.log('sin(x) =', parse('sin(x)').toString())

console.log('\n=== expand() ===')
console.log('(x + y)^2 →', expand(parse('(x + y)^2')).toString())
console.log('(x + 1)^3 →', expand(parse('(x + 1)^3')).toString())

console.log('\n=== factor() ===')
console.log('x^2 - y^2 →', factor(parse('x^2 - y^2')).toString())
console.log('x^2 + 2xy + y^2 →', factor(parse('x^2 + 2*x*y + y^2')).toString())

console.log('\n=== texParse() ===')
console.log('\\frac{x^2-1}{x-1} =', texParse('\\frac{x^2-1}{x-1}').toString())
console.log('\\sin(x) + \\cos(x) =', texParse('\\sin(x) + \\cos(x)').toString())
console.log('\\sqrt{x} =', texParse('\\sqrt{x}').toString())

console.log('\n=== toLatex() ===')
const e = parse('(x + y)^2')
console.log('(x + y)^2 →', e.toLatex())
console.log('sin(x) →', parse('sin(x)').toLatex())