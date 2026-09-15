const fs = require('fs');
const path = require('path');

function dataPathFor(baseDir) {
  return path.join(baseDir, 'puantaj_data.json');
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function ensureData(baseDir, initialDataPath) {
  fs.mkdirSync(baseDir, { recursive: true });
  const dataPath = dataPathFor(baseDir);
  const backupPath = dataPath + '.bak';
  if (!fs.existsSync(dataPath)) {
    const initial = readJson(initialDataPath);
    writeData(baseDir, initial);
    return initial;
  }
  try {
    return readJson(dataPath);
  } catch (err) {
    if (fs.existsSync(backupPath)) {
      const recovered = readJson(backupPath);
      writeData(baseDir, recovered);
      return recovered;
    }
    throw err;
  }
}

function writeData(baseDir, payload) {
  fs.mkdirSync(baseDir, { recursive: true });
  const dataPath = dataPathFor(baseDir);
  const backupPath = dataPath + '.bak';
  const tempPath = dataPath + '.tmp';
  if (fs.existsSync(dataPath)) fs.copyFileSync(dataPath, backupPath);
  const json = JSON.stringify(payload, null, 2);
  const fd = fs.openSync(tempPath, 'w');
  try {
    fs.writeFileSync(fd, json, 'utf8');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  try {
    fs.renameSync(tempPath, dataPath);
  } catch (err) {
    fs.copyFileSync(tempPath, dataPath);
    fs.unlinkSync(tempPath);
  }
  return dataPath;
}

module.exports = { dataPathFor, ensureData, writeData };
