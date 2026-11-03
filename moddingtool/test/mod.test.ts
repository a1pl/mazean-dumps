// yo im way too lazy, testing is dumb btw
// ai slop:

import { test } from "node:test";
import assert from "node:assert/strict";
import { Mod } from "../mod.js";

class Counter {
  n = 0;
  inc(by: number) { this.n += by; return this.n; }
}

const fakeInit = async (imports: any = { wbg: { __wbg_rnd_abc123: (m: number) => m - 1 } }) => {
  // Mimics wasm-bindgen: hands the import object to WebAssembly.instantiate.
  const bytes = new Uint8Array([0, 0x61, 0x73, 0x6d, 1, 0, 0, 0]);
  await WebAssembly.instantiate(bytes, imports);
  return { memory: new WebAssembly.Memory({ initial: 1 }), imports };
};

test("before/after/around/replace compose in order", async () => {
  const log: string[] = [];
  const mod = new Mod()
    .before(Counter.prototype, "inc", (_s, by) => { log.push(`before ${by}`); })
    .after(Counter.prototype, "inc", (_s, r) => { log.push(`after ${r}`); return r * 10; })
    .around(Counter.prototype, "inc", (_s, next, by) => next(by + 1));
  await mod.apply(fakeInit);
  assert.equal(new Counter().inc(1), 20);
  assert.deepEqual(log, ["before 1", "after 2"]);
});

test("replace receives the original", async () => {
  class A { v() { return 1; } }
  await new Mod().replace(A.prototype, "v", function (orig) { return orig() + 41; }).apply(fakeInit);
  assert.equal(new A().v(), 42);
});

test("import hooks match by substring and restore WebAssembly", async () => {
  const before = WebAssembly.instantiate;
  const out = await new Mod().hookImport("rnd", (orig, max: number) => orig(max) + 100).apply(fakeInit);
  assert.equal((out.imports.wbg as any).__wbg_rnd_abc123(10), 109);
  assert.equal(WebAssembly.instantiate, before);
});

test("mem read/write round-trips", async () => {
  const out = await new Mod().apply(fakeInit);
  out.mem.writeU32(8, 0xdeadbeef);
  assert.equal(out.mem.readU32(8), 0xdeadbeef);
});
