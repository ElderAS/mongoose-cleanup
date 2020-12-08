const ObjectId = require('mongoose').Types.ObjectId
const { pathOr } = require('ramda')

function ConvertToArray(val) {
  return val instanceof Array ? val : [val]
}

function ExtractObjectId(val) {
  return pathOr(val, ['_id'], val)
}

function CompareObjectId(a, b) {
  a = ExtractObjectId(a)
  b = ExtractObjectId(b)
  return [a, b].every((v) => v instanceof ObjectId) && a.equals(b)
}

module.exports = {
  ConvertToArray,
  CompareObjectId,
}
