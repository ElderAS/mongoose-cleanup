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
        item => !CompareObjectId(path(match, item), id),
      ))
    if (CompareObjectId(path(match, obj[currentKey]), id)) return (obj[currentKey] = undefined)
  }

  return ConvertToArray(obj[currentKey]).forEach(item =>
    removeValue(item, keys.join('.'), match, id),
  )
}

module.exports = function cleanupPlugin(schema, pluginOptions = {}) {
  let { relations } = pluginOptions

  if (!relations) return new Error('[MongooseCleanUp]: relations is required')
  if (!relations.length) return

  schema.post('remove', function() {
    relations.map(({ model, key, options = {} }) => {
      let query = {}
      let keys = ConvertToArray(key)

      keys.forEach(entry => {
        let value =
          typeof entry === 'string' ? entry : [entry.value, entry.match].filter(Boolean).join('.')
        query[value] = this._id
      })

      return this.model(model)
        .find(query)
        .then(items =>
          Promise.all(
            items.map(
              item =>
                new Promise((resolve, reject) => {
                  if (options.remove === 'value') {
                    keys.forEach(entry =>
                      removeValue(
                        item,
                        pathOr(entry, ['value'], entry),
                        path(['match'], entry),
                        this._id,
                      ),
                    )
                    item.save((err, item) => {
                      if (err) {
                        if (pluginOptions.debug)
                          console.log(
                            chalk`[MongooseCleanUp]: {bold.red Error at remove: } ${model} ${item.id}`,
                          )
                        return reject(err)
                      }

                      if (pluginOptions.debug)
                        console.log(
                          chalk`[MongooseCleanUp]: {bold.green Removed value: } ${model} ${item.id}`,
                        )
                      return item
                    })
                  } else {
                    item.remove((err, item) => {
                      if (err) {
                        if (pluginOptions.debug)
                          console.log(
                            chalk`[MongooseCleanUp]: {bold.red Error at remove: } ${model} ${item.id}`,
                          )
                        return reject(err)
                      }

                      if (pluginOptions.debug)
                        console.log(
                          chalk`[MongooseCleanUp]: {bold.green Removed: } ${model} ${item.id}`,
                        )
                      return item
                    })
                  }
                }),
            ),
          ),
        )
    })
  })
}
