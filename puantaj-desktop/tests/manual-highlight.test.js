const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const css=fs.readFileSync(path.join(__dirname,'../app/style.css'),'utf8');

test('manual accounting inputs are highlighted with a soft yellow-orange background',()=>{
  assert.match(css,/\.salary-input\{[^}]*background:#fff3d6/i);
  assert.match(css,/\.salary-input:focus\{[^}]*background:#ffe8ad/i);
});
