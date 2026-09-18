const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const source=fs.readFileSync(path.join(__dirname,'../app/groups-patch.js'),'utf8');

test('manual accounting inputs are highlighted with a soft yellow-orange background',()=>{
  assert.match(source,/background:#fff3d6/i);
  assert.match(source,/background:#ffe8ad/i);
});
