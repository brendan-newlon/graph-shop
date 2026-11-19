// Headless core self-test: extracts the gf-demo, gf-layout, gf-core, gf-sdx and gf-tests script blocks from
// graph-shop.html and runs the test cases in a Node VM. No network, no writes.
//   node tests/selftest.mjs              run against graph-shop.html
//   node tests/selftest.mjs --self-test  prove the harness catches a deliberately broken core
//   node tests/selftest.mjs <file.html>  run against another copy (e.g. another checkout)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const selfTest = args.includes('--self-test');
const htmlPath = args.find(a => !a.startsWith('--')) || join(here, '..', 'graph-shop.html');

function block(html, id) {
  const open = `<script id="${id}">`, start = html.indexOf(open);
  const end = start < 0 ? -1 : html.indexOf('</script>', start);
  const m = end < 0 ? null : [null, html.slice(start + open.length, end)];
  if (!m) throw new Error(`${htmlPath}: no <script id="${id}"> block found`);
  return m[1];
}
function run(extra) {
  const html = readFileSync(htmlPath, 'utf8');
  // the Designer block writes and reads files with the platform's compression and text codecs
  const ctx = vm.createContext({ console, performance, TextEncoder, TextDecoder, CompressionStream, DecompressionStream, Response, Blob, atob, btoa, crypto });
  for (const id of ['gf-demo', 'gf-layout', 'gf-core', 'gf-sdx']) vm.runInContext(block(html, id), ctx, { filename: id });
  if (extra) vm.runInContext(readFileSync(extra, 'utf8'), ctx, { filename: extra });
  vm.runInContext(block(html, 'gf-tests'), ctx, { filename: 'gf-tests' });
  return vm.runInContext('GF_TESTS.run()', ctx);
}

if (selfTest) {
  // Each fixture breaks the core in one known way; the named test must fail for each.
  const fixture = join(here, 'fixtures', 'broken_core.js');
  const expect = JSON.parse(/EXPECT_FAILING: (\[.*\])/.exec(readFileSync(fixture, 'utf8'))[1]);
  const r = run(fixture);
  const failing = r.results.filter(x => x.status === 'fail').map(x => x.name);
  const silent = expect.filter(e => !failing.some(f => f.startsWith(e)));
  if (silent.length) { console.log('self-test FAILED: these checks did not fire on the broken fixture:\n  ' + silent.join('\n  ')); process.exit(1); }
  console.log(`self-test ok (${expect.length} deliberate breakages caught)`);
  process.exit(0);
}

const r = run();
for (const x of r.results) if (x.status === 'fail') console.log(`FAIL ${x.name}\n     ${x.detail}`);
console.log(r.ok ? `selftest ok (${r.passed} passed)` : `selftest FAILED (${r.failed} of ${r.passed + r.failed})`);
process.exit(r.ok ? 0 : 1);
