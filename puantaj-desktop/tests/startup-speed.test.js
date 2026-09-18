const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const path=require('path');

const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'../package.json'),'utf8'));

test('portable build uses store compression for faster startup extraction',()=>{
  assert.equal(pkg.build.compression,'store');
  assert.equal(pkg.build.asar,true);
});
