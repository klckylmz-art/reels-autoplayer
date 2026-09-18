const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const patch=fs.readFileSync(path.join(__dirname,'../app/groups-patch.js'),'utf8');
const grouping=fs.readFileSync(path.join(__dirname,'../app/timesheet-grouping-patch.js'),'utf8');
const finalUi=fs.readFileSync(path.join(__dirname,'../app/ui-behavior-patch.js'),'utf8');
const utils=fs.readFileSync(path.join(__dirname,'../app/group-utils.js'),'utf8');
const main=fs.readFileSync(path.join(__dirname,'../app/main-patched.js'),'utf8');

test('program title is Hayal Kahvesi Puantaj',()=>{
  assert.match(main,/Hayal Kahvesi Puantaj/);
  assert.match(patch,/Hayal Kahvesi Puantaj/);
});

test('main puantaj is unified and shows editable Görevi column',()=>{
  assert.match(patch,/Görevi/);
  assert.match(patch,/data-role-id/);
  assert.match(patch,/role-select/);
  assert.doesNotMatch(patch,/mainTabs\.insertAdjacentElement\('afterend',groupTabs\)/);
});

test('accounting has group tabs and Genel Özet is moved to the last tab',()=>{
  assert.match(finalUi,/data-accounting-view="general"/);
  assert.match(finalUi,/appendChild\(general\)/);
  assert.match(utils,/Sahne Ücreti/);
  assert.match(utils,/Günlük Ücret/);
  assert.match(patch,/Genel Toplam Ödeme/);
});

test('accounting opens on Personel by default',()=>{
  assert.match(patch,/let accountingView='personel'/);
  assert.match(patch,/id==='personel'\?'active'/);
});

test('monthly puantaj fee inputs are soft turquoise while salary inputs stay yellow',()=>{
  assert.match(patch,/\.daily-fee-input\{background:#dff7f5!important/i);
  assert.match(patch,/\.daily-fee-input:focus\{background:#c9f0ec!important/i);
  assert.match(patch,/\.salary-input\{background:#fff3d6!important/i);
});

test('timesheet group headers use exact entry notes in bold red',()=>{
  assert.match(grouping,/return 'Çalışma saati girilir\. Tam gün için 8 girin\.'/);
  assert.match(grouping,/return 'Günlük ücret girilir\.'/);
  assert.doesNotMatch(grouping,/8 saat girin/);
  assert.match(grouping,/\.group-entry-note\{[\s\S]*font-weight:\s*800[\s\S]*color:\s*#c62828/i);
});

test('timesheet date header stays visible while scrolling down',()=>{
  assert.match(grouping,/#timesheet thead th\{[\s\S]*position:sticky[\s\S]*top:0/i);
  assert.match(grouping,/z-index:\s*8/i);
});
