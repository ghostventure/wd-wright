import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = process.cwd();

function fail(message) {
  console.error(`\n[deploy-guard] ${message}\n`);
  process.exit(1);
}

if (path.resolve(cwd) !== repoRoot) {
  fail(`Run deploys from ${repoRoot}, not ${cwd}.`);
}

const packageJsonPath = path.join(repoRoot, 'package.json');
const firebaseJsonPath = path.join(repoRoot, 'firebase.json');
const srcPath = path.join(repoRoot, 'src');
const appPath = path.join(repoRoot, 'app');
const nextConfigPath = path.join(repoRoot, 'next.config.js');

if (!fs.existsSync(packageJsonPath) || !fs.existsSync(firebaseJsonPath)) {
  fail('Missing package.json or firebase.json in the expected repo root.');
}

if (!fs.existsSync(srcPath) || !fs.existsSync(appPath) || !fs.existsSync(nextConfigPath)) {
  fail('WD Wright deploy guard did not find required app files. This does not look like the WD Wright repo.');
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const firebaseJson = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));

if (packageJson.name !== 'wd-wright') {
  fail(`Unexpected package name "${packageJson.name}". Refusing WD Wright deploy.`);
}

if (firebaseJson?.hosting?.public !== 'out') {
  fail(`firebase.json hosting.public must be "out", got "${firebaseJson?.hosting?.public ?? 'missing'}".`);
}

console.log('[deploy-guard] WD Wright repo verified. Safe to deploy.');
