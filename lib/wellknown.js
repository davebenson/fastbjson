
// must be less than 256 of these
exports.IDs = [
  "id", "latitude", "longitude", "name", "altName",
  "type", "class", "address", "city", "state", "country",

];

exports.IDtoIndex = {};
for (let i = 0; i < exports.IDs.length; i++)
  exports.IDtoIndex[id] = i;

