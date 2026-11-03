import type { HookEntry, ImportHookEntry, Phase } from "./types.js";
export class HookRegistry {
  readonly methods = new Map<object, Map<string, HookEntry[]>>();
  readonly imports: ImportHookEntry[] = [];

  add(target: object, method: string, phase: Phase, fn: Function): void {
    let byName = this.methods.get(target);
    if (!byName) this.methods.set(target, (byName = new Map()));
    let list = byName.get(method);
    if (!list) byName.set(method, (list = []));
    list.push({ phase, fn });
  }
}

export function compose(original: Function, entries: HookEntry[]): Function {
  const of = (p: Phase) => entries.filter((e) => e.phase === p).map((e) => e.fn);
  const befores = of("before"), afters = of("after");
  let inner = original;
  for (const e of entries) {
    if (e.phase === "replace") {
      const prev = inner;
      inner = function (this: unknown, ...a: unknown[]) {
        return e.fn.call(this, (...b: unknown[]) => prev.apply(this, b), ...a);
      };
    } else if (e.phase === "around") {
      const prev = inner;
      inner = function (this: unknown, ...a: unknown[]) {
        return e.fn(this, (...b: unknown[]) => prev.apply(this, b), ...a);
      };
    }
  }

  return function (this: unknown, ...args: unknown[]) {
    for (const f of befores) f(this, ...args);
    let result = inner.apply(this, args);
    for (const f of afters) {
      const r = f(this, result, ...args);
      if (r !== undefined) result = r;
    }
    return result;
  };
}
