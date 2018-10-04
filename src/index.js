
module.exports = function cleanupPlugin(schema, options) {
  if (options.debug) let chalk = require('chalk')
  if (!options || !options.relations) return new Error('[MongooseCleanUp]: options.relations is required')
  let rel = options.relations
  if (!rel.length) return

  schema.post('remove', function() {
    let operations = rel.map(({ model, key }) => {
      let query = {}

      if (key instanceof Array) {
        key.forEach(value => (query[value] = this._id))
      } else query[key] = this._id

      return this.model(model)
        .find(query)
        .then(items =>
          Promise.all(
            items.map(
              item =>
                new Promise((resolve, reject) => {
                  item.remove((err, item) => {
                    if (err) {
                      if (options.debug)
                        console.log(chalk`[MongooseCleanUp]: {bold.red Error at remove: } ${model} ${item.id}`)
                      return reject(err)
                    }

                    if (options.debug) console.log(chalk`[MongooseCleanUp]: {bold.green Removed: } ${model} ${item.id}`)
                    return item
                  })
                }),
            ),
          ),
        )
    })
  })
}
