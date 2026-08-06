const fs = require('fs');
const zlib = require('zlib');
const parts = ['01','02','03','04','05','06'].map(n => fs.readFileSync(`assets/core-v3-${n}.txt`, 'utf8'));
const encoded = parts.join('').replace(/\s+/g, '');
const decoded = zlib.gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
fs.writeFileSync('assets/game-core-v3.js', decoded);
console.log(`Decoded ${decoded.length} chars`);
