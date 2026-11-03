//object w/ patchable prototype
export type Target = Record<string, unknown>;

export type BeforeFn<T = unknown, Args extends unknown[] = unknown[]> =
  (self: T, ...args: Args) => void;

export type AfterFn<T = unknown, Args extends unknown[] = unknown[], R = unknown> =
  (self: T, result: R, ...args: Args) => R | void;

  export type AroundFn<T = unknown, Args extends unknown[] = unknown[], R = unknown> =
  (self: T, next: (...a: Args) => R, ...args: Args) => R;

export type ReplaceFn<T = unknown, Args extends unknown[] = unknown[], R = unknown> =
  (this: T, original: (...args: Args) => R, ...args: Args) => R;

export type Phase = "before" | "after" | "around" | "replace";

export interface HookEntry {
  phase: Phase;
  fn: Function;
}

// original import is first arg, then wasm args
export type ImportHookFn<Args extends unknown[] = unknown[], R = unknown> =
  (original: (...args: Args) => R, ...args: Args) => R;

export interface MemView {
  readonly memory: WebAssembly.Memory;

  readU8(ptr: number): number;
  readU16(ptr: number): number;
  readU32(ptr: number): number;
  readI8(ptr: number): number;
  readI16(ptr: number): number;
  readI32(ptr: number): number;
  readF32(ptr: number): number;
  readF64(ptr: number): number;

  writeU8(ptr: number, val: number): void;
  writeU16(ptr: number, val: number): void;
  writeU32(ptr: number, val: number): void;
  writeI8(ptr: number, val: number): void;
  writeI16(ptr: number, val: number): void;
  writeI32(ptr: number, val: number): void;
  writeF32(ptr: number, val: number): void;
  writeF64(ptr: number, val: number): void;

  // copy
  readBytes(ptr: number, len: number): Uint8Array;
  // write
  writeBytes(ptr: number, data: Uint8Array): void;
  // read string from ptr, ptr + len
  readStr(ptr: number, len: number): string;
}

export type ApplyResult<T> = T & { mem: MemView };

export interface ImportHookEntry {
  namePart: string;
  fn: ImportHookFn;
}
