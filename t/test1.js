const fastbjson = require('../lib/fastbjson');

function checkjson(j) {
  const binary = fastbjson.pack(j);
  const json = fastbjson.unpack(binary);
  assert.deepEquals(j, json);
}

checkjson(true);
checkjson(false);
checkjson(null);
checkjson("a");
checkjson(0);
checkjson(1);
checkjson(255);
checkjson(256);
checkjson("abcdefghiabcdefghiabcdefghiabcdefghiabcdefghiabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijjjjjjabcdefghij");
checkjson({a: 1});
checkjson(["a", 6]);
