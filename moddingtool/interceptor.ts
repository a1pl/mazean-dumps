import { compose, type HookRegistry } from "./hooks.js";
import type { ImportHookEntry } from "./types.js";

type ImportObject = Record<string, Record<string, unknown>>;

export function wrapImports(imports: ImportObject | undefined, hooks: ImportHookEntry[]): number {
  let n = 0;
  if (!imports || !hooks.length) return n;
  for (const mod of Object.values(imports)) {
    for (const [key, val] of Object.entries(mod)) {
      if (typeof val !== "function") continue;
      const matches = hooks.filter((h) => key.includes(h.namePart));
      if (!matches.length) continue;
      let wrapped = val as Function;
      for (const h of matches) {
        const prev = wrapped;
        wrapped = (...a: unknown[]) => h.fn((...b: unknown[]) => prev(...b), ...a);
      }
      mod[key] = wrapped;
      n++;
    }
  }
  return n;
}

export async function withImportHooks<T>(hooks: ImportHookEntry[], fn: () => Promise<T>): Promise<T> {
  const W = WebAssembly as any;
  const orig = { i: W.instantiate, s: W.instantiateStreaming };
  W.instantiate = (src: unknown, imp: ImportObject) => (wrapImports(imp, hooks), orig.i.call(W, src, imp));
  if (orig.s) W.instantiateStreaming = (src: unknown, imp: ImportObject) => (wrapImports(imp, hooks), orig.s.call(W, src, imp));
  try {
    return await fn();
  } finally {
    W.instantiate = orig.i;
    if (orig.s) W.instantiateStreaming = orig.s;
  }
}

export function patchMethods(reg: HookRegistry): void {
  for (const [target, byName] of reg.methods) {
    for (const [name, entries] of byName) {
      const t = target as Record<string, unknown>;
      const original = t[name];
      if (typeof original !== "function") throw new Error(`no method "${name}"`);
      t[name] = compose(original, entries);
    }
  }
}
