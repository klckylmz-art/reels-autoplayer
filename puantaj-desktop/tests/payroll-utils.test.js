const test=require('node:test');
const assert=require('node:assert/strict');
const {calculatePrime}=require('../app/payroll-utils');

test('prim is calculated salary minus entered Maaş',()=>{
  assert.equal(calculatePrime(42000,35000),7000);
  assert.equal(calculatePrime(35000,42000),-7000);
  assert.equal(calculatePrime(35000,35000),0);
});
