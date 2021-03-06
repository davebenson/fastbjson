"use strict";

const fastbjson = require('../lib/fastbjson');
const assert = require('assert');

function checkjson(j) {
  const binary = fastbjson.pack(j);
  //console.log(`binary=${JSON.stringify(binary.toJSON())}`);
  const json = fastbjson.unpack(binary);
  //console.log(`input=${JSON.stringify(j)}; output=${JSON.stringify(json)}`);
  assert.deepStrictEqual(j, json);
}

function genRepeated(n, fill) {
  let arr = [];
  for (let i = 0; i < n; i++)
    arr[i] = fill[i % fill.length];
  return arr;
}
function genBigMap(n, value) {
  let obj = {};
  for (let i = 0; i < n; i++)
    obj["a" + i] = value;
  return obj;
}



checkjson(true);
checkjson(false);
checkjson(null);
checkjson("a");
checkjson("abcde");
checkjson("abcdefghijklmnopqrstuvwxyz");
checkjson(0);
checkjson(1);
checkjson(255);
checkjson(256);
checkjson(-1);
checkjson(-256);
checkjson(-257);
checkjson(0.5);
checkjson("abcdefghiabcdefghiabcdefghiabcdefghiabcdefghiabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijjjjjjabcdefghij");
checkjson("abcdefghiabcdefghiabcdefghiabcdefghiabcdefghiabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijjjjjjabcdefghixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxj");
checkjson({a: 1});
checkjson({a0: "foo"});
checkjson({a0: "foo", a1: "foo"});
checkjson([]);
checkjson([false]);
checkjson(["a", 6]);

const tenstrings = ["a","b","c","d","e","f","g","h","i","j"];
checkjson(genRepeated(10, tenstrings));
checkjson(genRepeated(100, tenstrings));
checkjson(genRepeated(1000, tenstrings));

checkjson(genBigMap(10, "foo"));
checkjson(genBigMap(100, "foo"));
checkjson(genBigMap(1000, "foo"));

