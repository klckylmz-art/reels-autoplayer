const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const main=fs.readFileSync(path.join(__dirname,'../app/main-patched.js'),'utf8');
const salaryPatch=fs.readFileSync(path.join(__dirname,'../app/salary-prime-patch.js'),'utf8');

test('main loads summary grouping and full-cell input patch',()=>{
  assert.match(main,/summary-ui-patch\.js/);
});

test('summary UI patch groups monthly summary and makes salary input fill cell',()=>{
  const patchPath=path.join(__dirname,'../app/summary-ui-patch.js');
  assert.ok(fs.existsSync(patchPath));
  const patch=fs.readFileSync(patchPath,'utf8');
  assert.match(patch,/AYLIK ÖZET GRUPLAMA/);
  assert.match(patch,/PERSONEL/);
  assert.match(patch,/SANATÇI/);
  assert.match(patch,/GÜVENLİK/);
  assert.match(patch,/localeCompare\([^,]+,'tr-TR'/);
  assert.match(patch,/\.salary-input\{[^}]*width:100%[^}]*height:100%/s);
  assert.match(patch,/#bossTable td:has\(\.salary-input\)\{[^}]*padding:0/s);
});

test('personnel accounting table keeps input columns compact and money columns readable',()=>{
  const patch=fs.readFileSync(path.join(__dirname,'../app/summary-ui-patch.js'),'utf8');
  assert.match(patch,/#bossTable\.personnel-accounting/);
  assert.match(patch,/nth-child\(7\)[^}]*width:\s*9%/s);
  assert.match(patch,/nth-child\(9\)[^}]*width:\s*9%/s);
  assert.match(patch,/nth-child\(8\)[^}]*width:\s*9%/s);
  assert.match(patch,/nth-child\(10\)[^}]*width:\s*7%/s);
  assert.match(patch,/nth-child\(11\)[^}]*width:\s*9%/s);
  assert.match(patch,/nth-child\(12\)[^}]*width:\s*8%/s);
});

test('personnel accounting uses Toplam and Yapılan Ödeme headings',()=>{
  assert.match(salaryPatch,/<th>Toplam<\/th>/);
  assert.match(salaryPatch,/<th>Yapılan Ödeme<\/th>/);
  assert.doesNotMatch(salaryPatch,/<th>Brüt Maaş<\/th>/);
  assert.doesNotMatch(salaryPatch,/<th>Net Ödeme<\/th>/);
});

test('payment is black and prime changes color by sign',()=>{
  assert.match(salaryPatch,/class="payment-value"/);
  assert.match(salaryPatch,/prime-positive/);
  assert.match(salaryPatch,/prime-negative/);
  assert.match(salaryPatch,/prime===0\?'prime-zero'/);
  const patch=fs.readFileSync(path.join(__dirname,'../app/summary-ui-patch.js'),'utf8');
  assert.match(patch,/\.payment-value\{[^}]*color:#111/s);
  assert.match(patch,/\.prime-positive\{[^}]*color:#15803d[^}]*font-weight:800/s);
  assert.match(patch,/\.prime-negative\{[^}]*color:#b91c1c[^}]*font-weight:800/s);
});
