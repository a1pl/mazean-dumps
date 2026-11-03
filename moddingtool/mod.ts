import { HookRegistry } from "./hooks.js";
import { patchMethods, withImportHooks } from "./interceptor.js";
import { memView } from "./memory.js";
import type { AfterFn, ApplyResult, AroundFn, BeforeFn, ImportHookFn, MemView, ReplaceFn } from "./types.js";

type Methods<T> = { [K in keyof T]: T[K] extends (...a: any[]) => any ? K : never }[keyof T] & string;
type Args<T, K extends keyof T> = T[K] extends (...a: infer A) => any ? A : never;
type Ret<T, K extends keyof T> = T[K] extends (...a: any[]) => infer R ? R : never;

export class Mod {
  private reg = new HookRegistry();
  private ready: Array<(mem: MemView) => void> = [];

  before<T extends object, K extends Methods<T>>(target: T, method: K, fn: BeforeFn<any, Args<T, K>>): this {
    this.reg.add(target, method, "before", fn);
    return this;
  }

  after<T extends object, K extends Methods<T>>(target: T, method: K, fn: AfterFn<any, Args<T, K>, Ret<T, K>>): this {
    this.reg.add(target, method, "after", fn);
    return this;
  }

  // full control
  around<T extends object, K extends Methods<T>>(target: T, method: K, fn: AroundFn<any, Args<T, K>, Ret<T, K>>): this {
    this.reg.add(target, method, "around", fn);
    return this;
  }

  replace<T extends object, K extends Methods<T>>(target: T, method: K, fn: ReplaceFn<any, Args<T, K>, Ret<T, K>>): this {
    this.reg.add(target, method, "replace", fn);
    return this;
  }

  // namepart is substring cuz names are mangled
  hookImport(namePart: string, fn: ImportHookFn<any[], any>): this {
    this.reg.imports.push({ namePart, fn });
    return this;
  }

  onReady(cb: (mem: MemView) => void): this {
    this.ready.push(cb);
    return this;
  }

  async apply<T extends { memory: WebAssembly.Memory }>(
    init: (...a: any[]) => Promise<T>,
    ...initArgs: any[]
  ): Promise<ApplyResult<T>> {
    const out = await withImportHooks(this.reg.imports, () => init(...initArgs));
    patchMethods(this.reg);
    const mem = memView(out.memory);
    for (const cb of this.ready) cb(mem);
    return Object.assign({}, out, { mem });
  }
}
