const chalk = require('chalk')
const { path, pathOr } = require('ramda')
const { ConvertToArray, CompareObjectId } = require('./utils')

function removeValue(obj, key, match, id) {
  let keys = key.split('.')
  let currentKey = keys.shift()
  if (!match) match = []
  if (typeof match === 'string') match = match.split('.')

  if (!keys.length) {
    if (obj[currentKey] instanceof Array)
      return (obj[currentKey] = obj[currentKey].filter(
        (item) => !CompareObjectId(path(match, item), id),
      ))
    if (CompareObjectId(path(match, obj[currentKey]), id)) return (obj[currentKey] = undefined)
  }

  return ConvertToArray(obj[currentKey]).forEach((item) =>
    removeValue(item, keys.join('.'), match, id),
  )
}

function BuildKeyQuery(query, entry, id) {
  if (typeof entry === 'string') entry = { value: entry }
  let key = [entry.value, entry.match].filter(Boolean).join('.')

  query[key] = id
}

module.exports = function cleanupPlugin(schema, pluginOptions = {}) {
  let { relations, debug } = pluginOptions

  if (!relations) return new Error('[MongooseCleanUp]: relations is required')
  if (!relations.length) return

  schema.post('remove', function () {
    relations.map(({ model, key, options = {} }) => {
      let query = {}
      let keys = ConvertToArray(key)

      keys.forEach((val) => BuildKeyQuery(query, val, this._id))

      return this.model(model)
        .find(query)
        .then((items) =>
          Promise.all(
            items.map(
              (item) =>
                new Promise((resolve, reject) => {
                  let removeType =
                    typeof options.remove === 'function' ? options.remove(item) : options.remove

                  if (removeType === 'value') {
                    keys.forEach((entry) =>
                      removeValue(
                        item,
                        pathOr(entry, ['value'], entry),
                        path(['match'], entry),
                        this._id,
                      ),
                    )
                    item.save((err, item) => {
                      if (err) {
                        if (debug)
                          console.log(
                            chalk`[MongooseCleanUp]: {bold.red Error at remove: } ${model} ${item.id}`,
                          )
                        return reject(err)
                      }

                      if (debug)
                        console.log(
                          chalk`[MongooseCleanUp]: {bold.green Removed value: } ${model} ${item.id}`,
                        )
                      return resolve(item)
                    })
                  } else {
                    item.remove((err, item) => {
                      if (err) {
                        if (debug)
                          console.log(
                            chalk`[MongooseCleanUp]: {bold.red Error at remove: } ${model} ${item.id}`,
                          )
                        return reject(err)
                      }

                      if (debug)
                        console.log(
                          chalk`[MongooseCleanUp]: {bold.green Removed: } ${model} ${item.id}`,
                        )
                      return resolve(item)
                    })
                  }
                }),
            ),
          ),
        )
    })
  })
}
