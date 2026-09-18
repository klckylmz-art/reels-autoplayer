const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const patch=fs.readFileSync(path.join(__dirname,'../app/groups-patch.js'),'utf8');
const utils=fs.readFileSync(path.join(__dirname,'../app/group-utils.js'),'utf8');
const main=fs.readFileSync(path.join(__dirname,'../app/main-patched.js'),'utf8');

test('program title is Hayal Kahvesi Puantaj',()=>{
  assert.match(main,/Hayal Kahvesi Puantaj/);
  assert.match(patch,/Hayal Kahvesi Puantaj/);
});

test('group UI contains Personel Sanatçı and Güvenlik',()=>{
  assert.match(patch,/Personel/);
  assert.match(patch,/Sanatçı/);
  assert.match(patch,/Güvenlik/);
  assert.match(utils,/Sahne Ücreti/);
  assert.match(utils,/Günlük Ücret/);
  assert.match(patch,/Genel Toplam Ödeme/);
});

test('daily fee and salary inputs are highlighted',()=>{
  assert.match(patch,/\.salary-input,\.daily-fee-input\{background:#fff3d6/i);
  assert.match(patch,/\.salary-input:focus,\.daily-fee-input:focus\{background:#ffe8ad/i);
});
