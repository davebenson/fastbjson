"use strict";

const fs = require('fs');

// must be less than 64 of these
exports.IDs = fs.readFileSync(`${__dirname}/wellknown-keys.txt`, 'utf8')
                .split("\n")
                .filter((line) => {
                  const str = line.replace(/\s*#.*/, "").replace(/\s+$/, "");
                  return (str !== '');
                });


exports.IDtoIndex = {};
for (let i = 0; i < exports.IDs.length; i++)
  exports.IDtoIndex[exports.IDs[i]] = i;

