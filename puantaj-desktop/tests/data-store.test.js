const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ensureData, writeData, dataPathFor } = require('../app/data-store');

function tempDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'puantaj-')); }
function writeInitial(dir, obj) { const p = path.join(dir, 'initial.json'); fs.writeFileSync(p, JSON.stringify(obj)); return p; }

test('portable data filename is data.json', () => {
  assert.equal(path.basename(dataPathFor('C:/Puantaj')), 'data.json');
});

test('creates JSON from initial data when missing', () => {
  const dir = tempDir(), initial = { db: { employees: [{name:'A'}] }, salary: null };
  const initialPath = writeInitial(dir, initial);
  assert.deepEqual(ensureData(dir, initialPath), initial);
  assert.deepEqual(JSON.parse(fs.readFileSync(dataPathFor(dir), 'utf8')), initial);
});

test('every write is immediately readable and creates backup', () => {
  const dir = tempDir(), initialPath = writeInitial(dir, { value: 1 });
  ensureData(dir, initialPath);
  writeData(dir, { value: 2 });
  assert.equal(JSON.parse(fs.readFileSync(dataPathFor(dir), 'utf8')).value, 2);
  assert.equal(JSON.parse(fs.readFileSync(dataPathFor(dir)+'.bak', 'utf8')).value, 1);
});

test('recovers corrupt main data from backup', () => {
  const dir = tempDir(), initialPath = writeInitial(dir, { value: 1 });
  ensureData(dir, initialPath);
  writeData(dir, { value: 2 });
  fs.writeFileSync(dataPathFor(dir), '{broken');
  const recovered = ensureData(dir, initialPath);
  assert.equal(recovered.value, 1);
});
