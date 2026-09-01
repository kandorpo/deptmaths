const fs = require('fs');

let fileContent = fs.readFileSync('src/data/departmentData.ts', 'utf8');

fileContent = fileContent.replace(/export const FAMOUS_QUOTES = \[[\s\S]*?\];\n\n/, `export const FAMOUS_QUOTES = [
  { quote: "Mathematics is the queen of the sciences.", author: "Carl Friedrich Gauss", role: "Mathematician" },
  { quote: "Pure mathematics is, in its way, the poetry of logical ideas.", author: "Albert Einstein", role: "Theoretical Physicist" },
  { quote: "The essence of mathematics lies in its freedom.", author: "Georg Cantor", role: "Mathematician" },
  { quote: "Mathematics knows no races or geographic boundaries; for mathematics, the cultural world is one country.", author: "David Hilbert", role: "Mathematician" }
];\n\n`);

fs.writeFileSync('src/data/departmentData.ts', fileContent);
