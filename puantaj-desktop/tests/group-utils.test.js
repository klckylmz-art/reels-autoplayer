const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeGroup,feeLabel,calculateDailyPayment,calculateGeneralPayment}=require('../app/group-utils');

test('missing or unknown group defaults to personel',()=>{
  assert.equal(normalizeGroup(), 'personel');
  assert.equal(normalizeGroup(''), 'personel');
  assert.equal(normalizeGroup('other'), 'personel');
  assert.equal(normalizeGroup('sanatci'), 'sanatci');
  assert.equal(normalizeGroup('guvenlik'), 'guvenlik');
});

test('daily fee labels match group',()=>{
  assert.equal(feeLabel('sanatci'),'Sahne Ücreti');
  assert.equal(feeLabel('guvenlik'),'Günlük Ücret');
});

test('artist and security net payment subtract salary and advance from daily fee total',()=>{
  assert.equal(calculateDailyPayment(30000,10000,3000),17000);
  assert.equal(calculateDailyPayment(7600,4000,0),3600);
});

test('general payment sums net payments from all three groups',()=>{
  assert.equal(calculateGeneralPayment({personel:12000,sanatci:17000,guvenlik:8000}),37000);
});
