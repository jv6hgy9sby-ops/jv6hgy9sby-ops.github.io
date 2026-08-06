const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.resolve(__dirname, '..');
const parts = [];
for (let i = 1; i <= 6; i += 1) {
  const file = path.join(root, 'assets', `core-v3-0${i}.txt`);
  if (fs.existsSync(file)) parts.push(fs.readFileSync(file, 'utf8').replace(/\s+/g, ''));
}
if (!parts.length) throw new Error('No core-v3 parts found');

const packed = Buffer.from(parts.join(''), 'base64');
let source;
try {
  source = zlib.gunzipSync(packed).toString('utf8');
} catch (error) {
  source = zlib.unzipSync(packed).toString('utf8');
}

const debugDir = path.join(root, 'debug');
fs.mkdirSync(debugDir, { recursive: true });
fs.writeFileSync(path.join(debugDir, 'game-core-decoded.js'), source);

const lines = source.split(/\r?\n/);
const patterns = [
  /keydown|keyup|KeyboardEvent/i,
  /KeyW|KeyA|KeyS|KeyD|ArrowUp|ArrowDown|ArrowLeft|ArrowRight/i,
  /position\.(x|z)|\.position\s*\[/i,
  /controlsLocked|playerCanMove|gameRunning|paused|cinematic/i,
  /requestAnimationFrame|function\s+animate|function\s+update/i,
  /idle|walk|run/i,
  /joystick|touch|pointer/i
];

const hits = [];
for (let index = 0; index < lines.length; index += 1) {
  if (patterns.some((pattern) => pattern.test(lines[index]))) {
    const from = Math.max(0, index - 2);
    const to = Math.min(lines.length, index + 3);
    hits.push(`--- lines ${from + 1}-${to} ---\n${lines.slice(from, to).map((line, offset) => `${from + offset + 1}: ${line}`).join('\n')}`);
  }
}

const summary = [
  `Decoded bytes: ${Buffer.byteLength(source, 'utf8')}`,
  `Decoded lines: ${lines.length}`,
  `Matched contexts: ${hits.length}`,
  '',
  hits.join('\n\n')
].join('\n');
fs.writeFileSync(path.join(debugDir, 'core-analysis.txt'), summary);
console.log(summary.slice(0, 10000));
