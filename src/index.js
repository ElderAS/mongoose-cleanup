const ObjectId = require("mongoose").Types.ObjectId;
const { path, pathOr } = require("ramda");
let chalk;

function toArray(val) {
  return val instanceof Array ? val : [val];
}

function removeValue(obj, key, match, id) {
  let keys = key.split(".");
  let currentKey = keys.shift();
  if (!match) match = [];
  if (typeof match === "string") match = match.split(".");

  if (!keys.length) {
    if (obj[currentKey] instanceof Array)
      return (obj[currentKey] = obj[currentKey].filter(
        item => !ObjectIdCondition(path(match, item), id)
      ));
    if (ObjectIdCondition(path(match, obj[currentKey]), id))
      return (obj[currentKey] = undefined);
  }

  return toArray(obj[currentKey]).forEach(item =>
    removeValue(item, keys.join("."), match, id)
  );
}

function ObjectIdCondition(obj, id) {
  let target = pathOr(obj, ["_id"], obj);
  return target instanceof ObjectId && target.equals(id);
}

module.exports = function cleanupPlugin(schema, pluginOptions) {
  if (pluginOptions.debug) chalk = require("chalk");
  if (!pluginOptions || !pluginOptions.relations)
    return new Error("[MongooseCleanUp]: options.relations is required");
  let rel = pluginOptions.relations;
  if (!rel.length) return;

  schema.post("remove", function() {
    rel.map(({ model, key, options = {} }) => {
      let query = {};

      let keys = key instanceof Array ? key : [key];
      keys.forEach(entry => {
        let value =
          typeof entry === "string"
            ? entry
            : [entry.value, entry.match].filter(Boolean).join(".");
        query[value] = this._id;
      });

      return this.model(model)
        .find(query)
        .then(items =>
          Promise.all(
            items.map(
              item =>
                new Promise((resolve, reject) => {
                  if (options.remove === "value") {
                    keys.forEach(entry =>
                      removeValue(
                        item,
                        pathOr(entry, ["value"], entry),
                        path(["match"], entry),
                        this._id
                      )
                    );
                    item.save((err, item) => {
                      if (err) {
                        if (pluginOptions.debug)
                          console.log(
                            chalk`[MongooseCleanUp]: {bold.red Error at remove: } ${model} ${
                              item.id
                            }`
                          );
                        return reject(err);
                      }

                      if (pluginOptions.debug)
                        console.log(
                          chalk`[MongooseCleanUp]: {bold.green Removed value: } ${model} ${
                            item.id
                          }`
                        );
                      return item;
                    });
                  } else {
                    item.remove((err, item) => {
                      if (err) {
                        if (pluginOptions.debug)
                          console.log(
                            chalk`[MongooseCleanUp]: {bold.red Error at remove: } ${model} ${
                              item.id
                            }`
                          );
                        return reject(err);
                      }

                      if (pluginOptions.debug)
                        console.log(
                          chalk`[MongooseCleanUp]: {bold.green Removed: } ${model} ${
                            item.id
                          }`
                        );
                      return item;
                    });
                  }
                })
            )
          )
        );
    });
  });
};
