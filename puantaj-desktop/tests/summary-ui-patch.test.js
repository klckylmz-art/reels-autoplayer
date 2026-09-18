const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const main=fs.readFileSync(path.join(__dirname,'../app/main-patched.js'),'utf8');

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
  assert.match(patch,/nth-child\(7\)[^}]*width:\s*9%/s);   // Saat Ücreti
  assert.match(patch,/nth-child\(9\)[^}]*width:\s*9%/s);   // Maaş
  assert.match(patch,/nth-child\(8\)[^}]*width:\s*9%/s);   // Brüt Maaş
  assert.match(patch,/nth-child\(10\)[^}]*width:\s*7%/s);  // Avans
  assert.match(patch,/nth-child\(11\)[^}]*width:\s*9%/s);  // Net Ödeme
  assert.match(patch,/nth-child\(12\)[^}]*width:\s*8%/s);  // Prim
});
