const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {calculatePrime}=require('../app/payroll-utils');

test('prim is net payment minus entered Maaş',()=>{
  assert.equal(calculatePrime(7600,4000),3600);
  assert.equal(calculatePrime(4000,7600),-3600);
  assert.equal(calculatePrime(4000,4000),0);
});

test('Muhasebe Prim uses Net Ödeme rather than Brüt Maaş',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../app/salary-prime-patch.js'),'utf8');
  assert.match(source,/calculatePrime\(t\.net,salary\)/);
});
