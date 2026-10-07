import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const repo = process.env.GITHUB_REPOSITORY;
const commit = process.env.GITHUB_SHA;
if (repo !== 'ZoNampoina/soratro' || !/^[a-f0-9]{40}$/.test(commit ?? '')) throw new Error('Contexte de publication invalide.');
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const tag = 'v' + version;
const gh = (...args) => execFileSync('gh', [...args, '--repo', repo], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
// A versioned release is immutable in meaning. Later source commits retain their Actions artifacts.
let existing = false;
try { gh('release', 'view', tag, '--json', 'tagName'); existing = true; } catch {}
if (existing) {
  console.log('La release ' + tag + ' existe déjà ; son APK est conservé.');
  process.exit(0);
}
const deadline = Date.now() + 10 * 60 * 1000;
let run;
while (Date.now() < deadline) {
  const runs = JSON.parse(gh('run', 'list', '--workflow', 'android.yml', '--commit', commit, '--limit', '20', '--json', 'databaseId,status,conclusion,headSha'));
  run = runs.find(r => r.headSha === commit && r.conclusion === 'success');
  if (run) break;
  if (runs.length && runs.every(r => r.status === 'completed')) throw new Error('Le build Android de ce commit a échoué. Aucun APK publié.');
  await new Promise(resolve => setTimeout(resolve, 20000));
}
if (!run) throw new Error('APK validé non disponible après dix minutes.');
mkdirSync('tmp/release', { recursive: true });
gh('run', 'download', String(run.databaseId), '--name', 'SORATRO-Android-' + commit, '--dir', 'tmp/release');
const source = 'tmp/release/app-debug.apk';
const embedded = JSON.parse(execFileSync('unzip', ['-p', source, 'assets/public/version.json'], { encoding: 'utf8' }));
if (embedded.commit !== commit || embedded.version !== version) throw new Error('APK ne correspondant pas au commit publié.');
const apk = 'tmp/release/SORATRO-' + version + '-debug.apk';
copyFileSync(source, apk);
const checksum = createHash('sha256').update(readFileSync(apk)).digest('hex');
writeFileSync('tmp/release/SHA256SUMS.txt', checksum + '  SORATRO-' + version + '-debug.apk\n');
gh('release', 'create', tag, apk, 'tmp/release/SHA256SUMS.txt', '--target', commit, '--title', 'SORATRO ' + version + ' — Web et APK de test', '--prerelease', '--latest=false', '--notes-file', 'docs/RELEASE-V0.2.md');
console.log('APK de test publié pour ' + commit + ' — SHA-256 ' + checksum);
