#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

let strip;
try{
  strip = require('strip-comments');
}catch(e){
  console.error('Please install strip-comments: npm install --save-dev strip-comments');
  process.exit(1);
}

const IGNORES = new Set(['node_modules', 'android', 'ios', 'build', 'dist', 'windows', '.git']);
let modified = 0;

function shouldIgnore(fullPath){
  const parts = fullPath.split(path.sep);
  return parts.some(p => IGNORES.has(p));
}

function walkAndProcess(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries){
    const full = path.join(dir, ent.name);
    if (shouldIgnore(full)) continue;
    if (ent.isDirectory()){
      walkAndProcess(full);
      continue;
    }
    if (!full.endsWith('.js') && !full.endsWith('.jsx')) continue;
    try{
      const original = fs.readFileSync(full, 'utf8');
      const stripped = strip(original);
      if (stripped !== original){
        fs.writeFileSync(full, stripped, 'utf8');
        modified++;
        console.log('Stripped comments:', path.relative(process.cwd(), full));
      }
    }catch(e){
      console.error('Error processing', full, e && e.message);
    }
  }
}

try{
  walkAndProcess(process.cwd());
  console.log(`Done. Files modified: ${modified}`);
}catch(e){
  console.error('Fatal error', e && e.message);
  process.exit(1);
}
