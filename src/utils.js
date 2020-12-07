const { pathOr } = require('ramda')

function ConvertToArray(val) {
  return val instanceof Array ? val : [val]
}

function ExtractObjectId(val) {
  return pathOr(val, ['_id'], val)
}

function CastToString(val) {
  if (typeof val === 'string') return val
  if ('toString' in val) return val.toString()

  return val._id.toString()
}

function CompareObjectId(a, b) {
  a = CastToString(ExtractObjectId(a))
  b = CastToString(ExtractObjectId(b))
  return a === b
}

module.exports = {
  ConvertToArray,
  CompareObjectId,
  CastToString,
}
