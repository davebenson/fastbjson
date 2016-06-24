"use strict";

/*
 * 1  == false
 * 2  == true
 * 3  == null
 * 4..19 == short strings (less than 16 bytes of utf8)
 * 20 == b128-length prefixed string (after subtracting 16)
 * 21 == integer 0..255
 * 22 == integer -1..-256
 * 23..27 == reserved
 * 28 == double ieee754 LE
 * 30..45 == arrays of length 0 .. 15; array elements follow
 * 46 == b128-length prefixed array (after subtracting 16); array elements follow
 * 50..65 == objects of key-count 0 .. 15; kv-pairs follow
 * 66 == b128-length prefixed array (after subtracting 16); kv-pairs follow
 *
 *   kv-pair syntax
 *    one of:
 *      0..63 .. one of the well-known keywords
 *      otherwise: b128encoded(key_length+64);
 *    followed by value
 */

const wellknown = require('./wellknown');

function pack(json, pieces) {
  let size = 0;
  switch (typeof(json)) {
    case 'boolean':
      pieces.push(json ? 2 : 1);
      size++;
      break;
      
    case 'string':
      const utf8 = Buffer.from(json, 'utf8');
      if (utf8.length < 16) {
        pieces.push(utf8.length + 3);
      } else {
        pieces.push(19);
        size++;
        size += pushNumber_b128(pieces, utf8.length - 16);
        size += utf8.length;
        pieces.push(utf8);
      }
      break;
      
    case 'number':
      let fallback = false;
      if (Math.floor(json) === json) {
        if (0 <= json && json < 256) {
          pieces.push(20);
          pieces.push(json);
          size += 2;
        } else if (-256 <= json && json < 0) {
          pieces.push(21);
          pieces.push(json + 256);
          size += 2;
        } else {
          fallback = true;
        }
      } else {
        fallback = true;
      }
      if (fallback) {
        const b = Buffer.allocUnsafe(9);
        b[0] = 28;
        b.writeDoubleLE(json, 1);
        pieces.push(b);
        size += 7;
      }
      break;

    case 'object':
      if (json === null) {
        pieces.push(3);
        size++;
      } else if (Array.isArray(json)) {
        if (json.length < 16) {
          pieces.push(30 + json.length);
          size++;
        } else {
          pieces.push(46);
          size++;
          size += pushNumber_b128(pieces, json.length - 16);
        }
        for (let i = 0; i < json.length; i++)
          size += pack(json[i], pieces);
      } else {
        const keys = [];
        for (let key in json) {
          keys.push(key);
        }
        if (keys.length < 16) {
          pieces.push(50 + keys.length);
          size++;
        } else {
          pieces.push(66);
          size++;
          size += pushNumber_b128(pieces, keys.length - 16);
        }
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i * 2];
          const value = json[key];
          const idx = magic.IDtoIndex(key);
          if (idx === undefined) {
            const key_utf8 = Buffer.from(key);
            size += pushNumber_b128(pieces, key_utf8.length + 64);
            pieces.push(key_utf8);
            size += key_utf8.length;
          } else {
            pieces.push(idx);
            size += 2;
          }
          size += pack(value, pieces);
        }
      }
      break;
    default:
      console.log(`fastbjson pack: type=${typeof(json)}`);
      assert(false);
      break;
  }
  return size;
}

exports.module = function(json) {
  const pieces = [];
  const size = pack(json, pieces);
  const rv = Buffer.allocUnsafe(size);
  let rv_size = 0;
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    switch (typeof(p)) {
      case 'number': rv[rv_size++] = p; break;
      case 'object':
        if (Buffer.isBuffer(p)) {
          p.copy(rv, rv_size);
          rv_size += p.length;
          break;
        }
      default:
        assert(false);
    }
  }
  assert.equal(rv_size, size);
  return rv;
};
