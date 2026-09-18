const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const index=fs.readFileSync(path.join(__dirname,'../app/index.html'),'utf8');
const patch=fs.readFileSync(path.join(__dirname,'../app/groups-patch.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'../app/style.css'),'utf8');

test('program title is Hayal Kahvesi Puantaj',()=>{
  assert.match(index,/Hayal Kahvesi Puantaj/);
});

test('group UI contains Personel Sanatçı and Güvenlik',()=>{
  assert.match(patch,/Personel/);
  assert.match(patch,/Sanatçı/);
  assert.match(patch,/Güvenlik/);
  assert.match(patch,/Sahne Ücreti/);
  assert.match(patch,/Günlük Ücret/);
  assert.match(patch,/Genel Toplam Ödeme/);
});

test('daily fee inputs are highlighted',()=>{
  assert.match(style,/\.daily-fee-input\{[^}]*background:#fff3d6/i);
});
