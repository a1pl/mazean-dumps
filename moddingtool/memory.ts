import type { MemView } from "./types.js";

const utf8 = new TextDecoder();

export function memView(memory: WebAssembly.Memory): MemView {
  const dv = () => new DataView(memory.buffer);
  return {
    memory,
    readU8: (p) => dv().getUint8(p),
    readU16: (p) => dv().getUint16(p, true),
    readU32: (p) => dv().getUint32(p, true),
    readI8: (p) => dv().getInt8(p),
    readI16: (p) => dv().getInt16(p, true),
    readI32: (p) => dv().getInt32(p, true),
    readF32: (p) => dv().getFloat32(p, true),
    readF64: (p) => dv().getFloat64(p, true),
    writeU8: (p, v) => dv().setUint8(p, v),
    writeU16: (p, v) => dv().setUint16(p, v, true),
    writeU32: (p, v) => dv().setUint32(p, v, true),
    writeI8: (p, v) => dv().setInt8(p, v),
    writeI16: (p, v) => dv().setInt16(p, v, true),
    writeI32: (p, v) => dv().setInt32(p, v, true),
    writeF32: (p, v) => dv().setFloat32(p, v, true),
    writeF64: (p, v) => dv().setFloat64(p, v, true),
    readBytes: (p, n) => new Uint8Array(memory.buffer, p, n).slice(),
    writeBytes: (p, d) => new Uint8Array(memory.buffer).set(d, p),
    readStr: (p, n) => utf8.decode(new Uint8Array(memory.buffer, p, n)),
  };
}
