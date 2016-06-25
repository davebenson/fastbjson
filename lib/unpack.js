"use strict";

const wellknown = require('./wellknown');
const assert = require('assert');

const handle_unrecognizedBytePrefix = (buffer, offset) => {
  return `error: unknown byte prefix ${buffer[offset]}`;
};

function unpack_b128(buffer, offset) {
  let at = offset;
  let v = buffer[at] & 0x7f;
  let sh = 7;
  while (buffer[at] & 0x80) {
    at++;
    v |= (buffer[at] & 0x7f) << sh;
    sh += 7;
  }
  const n = at - offset + 1;
  assert(n <= 5);
  return [n, v];
}

function unpackKeyAtIndex(buffer, offset) {
  if (buffer[offset] < 64) {
    const key = wellknown.IDs[buffer[offset]];
    return [1, key];
  } else {
    const tmp = unpack_b128(buffer, offset);
    const utf8len = tmp[1] - 64;
    const key = buffer.toString('utf8', offset + tmp[0], offset + tmp[0] + utf8len);
    return [tmp[0] + utf8len, key];
  }
}

const rangesConfig = [
  {
    start: 1,
    count: 1,
    unpacker: (buffer, offset) => {
      return [1, false];
    }
  },
  {
    start: 2,
    count: 1,
    unpacker: (buffer, offset) => {
      return [1, true];
    }
  },
  {
    start: 3,
    count: 1,
    unpacker: (buffer, offset) => {
      return [1, null];
    }
  },
  {
    start: 4,
    count: 16,
    unpacker: (buffer, offset) => {
      const length = buffer[offset] - 4;
      const utf8 = buffer.toString('utf8', offset + 1, offset + 1 + length);
      return [1 + length, utf8];
    }
  },
  {
    start: 20,
    count: 1,
    unpacker: (buffer, offset) => {
      const b = unpack_b128(buffer, offset + 1);
      const prefixLen = b[0];
      const utf8bytes = b[1] + 16;
      const startOffset = offset + 1 + prefixLen;
      const str = buffer.toString('utf8', startOffset, startOffset + utf8bytes);
      return [1 + prefixLen + utf8bytes, str];
    }
  },
  {
    start: 21,
    count: 1,
    unpacker: (buffer, offset) => {
      return [2, buffer[offset + 1]];
    }
  },
  {
    start: 22,
    count: 1,
    unpacker: (buffer, offset) => {
      return [2, buffer[offset + 1] - 256];
    }
  },
  {
    start: 28,
    count: 1,
    unpacker: (buffer, offset) => {
      return [9, buffer.readDoubleLE(offset + 1)];
    }
  },
  {
    start: 30,
    count: 16,
    unpacker: (buffer, offset) => {
      const n = buffer[offset] - 30;
      const arr = [];
      let at = offset + 1;
      for (let i = 0; i < n; i++) {
        const subrv = unpackAtIndex(buffer, at);
        at += subrv[0];
        arr[i] = subrv[1];
      }
      return [at - offset, arr];
    }
  },
  {
    start: 46,
    count: 1,
    unpacker: (buffer, offset) => {
      const len_rv = unpack_b128(buffer, offset + 1);
      const len_len = len_rv[0];
      const n = len_rv[1] + 16;
      const arr = [];
      let at = offset + 1 + len_len;
      for (let i = 0; i < n; i++) {
        const subrv = unpackAtIndex(buffer, at);
        at += subrv[0];
        arr[i] = subrv[1];
      }
      return [at - offset, arr];
    }
  },
  {
    start: 50,
    count: 16,
    unpacker: (buffer, offset) => {
      const n = buffer[offset] - 50;
      const obj = {};
      let at = offset + 1;
      for (let i = 0; i < n; i++) {
        const keyrv = unpackKeyAtIndex(buffer, at);
        at += keyrv[0];
        const valuerv = unpackAtIndex(buffer, at);
        at += valuerv[0];
        obj[keyrv[1]] = valuerv[1];
      }
      return [at - offset, obj];
    }
  },
  {
    start: 66,
    count: 1,
    unpacker: (buffer, offset) => {
      const len_rv = unpack_b128(buffer, offset + 1);
      const len_len = len_rv[0];
      const n = len_rv[1] + 16;
      const obj = {};
      let at = offset + 1 + len_len;
      for (let i = 0; i < n; i++) {
        const keyrv = unpackKeyAtIndex(buffer, at);
        at += keyrv[0];
        const valuerv = unpackAtIndex(buffer, at);
        at += valuerv[0];
        obj[keyrv[1]] = valuerv[1];
      }
      return [at - offset, obj];
    }
  },
];

const unpackerByInitialByte = [];

for (let i = 0; i < rangesConfig.length; i++) {
  while (unpackerByInitialByte.length < rangesConfig[i].start)
    unpackerByInitialByte.push(handle_unrecognizedBytePrefix);
  const u = rangesConfig[i].unpacker;
  for (let j = 0; j < rangesConfig[i].count; j++)
    unpackerByInitialByte[rangesConfig[i].start + j] = u;
}
while (unpackerByInitialByte.length < 256)
  unpackerByInitialByte.push(handle_unrecognizedBytePrefix);

function unpackAtIndex(buffer, offset) {
  return unpackerByInitialByte[buffer[offset]](buffer, offset);
}

function unpack(buffer) {
  const rv = unpackAtIndex(buffer, 0);
  const size = rv[0];
  const json = rv[1];
  if (buffer.length !== size) {
    throw(`trailing garbage after index ${size}`);
  }
  return json;
}

module.exports = unpack;
