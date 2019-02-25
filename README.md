# mongoose-cleanup

[![Build Status](https://travis-ci.org/crsten/mongoose-cleanup.svg?branch=master&style=flat-square)](https://travis-ci.org/crsten/mongoose-cleanup)
[![npm](https://img.shields.io/npm/dt/mongoose-cleanup.svg?style=flat-square)](https://www.npmjs.com/package/mongoose-cleanup)
[![npm](https://img.shields.io/npm/v/mongoose-cleanup.svg?style=flat-square)](https://www.npmjs.com/package/mongoose-cleanup)

[Mongoose](http://mongoosejs.com/) plugin to automatically delete related documents.

### Installation

`npm install --save mongoose-cleanup`

### Usage

```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongooseCleanup = require("mongoose-cleanup");

let YourSchema = new Schema({
  title: String,
  description: String,
  author: String
});

YourSchema.plugin(mongooseCleanup, {
  relations: [{ model: "SomeOtherModel", key: "author" }],
  debug: true // Default: false -> If true operations are logged out in your console
});

let Model = mongoose.model("YourSchema", YourSchema);
```

### Important note

This plugin relies on [Mongoose Middleware](http://mongoosejs.com/docs/middleware).
Make sure to delete your documents with document.remove() and not via Model.remove().

### Options

#### relations

Define all relations this model has to other models.

relations is an `Array` and takes `Objects` like this:

```js
{
  model: 'SomeModel', //Name of the model that has a reference to this model
  key: 'reference' //Name of the key that holds the relation. You can send an array aswell
}
```

or this

```js
{
  model: 'SomeModel', //Name of the model that has a reference to this model
  key: 'reference' //Name of the key that holds the relation. You can send an array aswell
  options: {
    remove: 'value' // Set this to 'value' if you don't want to remove the whole doc but only the reference
  }
}
```

or this

```js
{
  model: 'SomeModel', //Name of the model that has a reference to this model
  key: { value: 'reference', match: 'inner.value' } // Use this syntax if you want to remove 'reference' if it matches with 'reference.inner.value'
  options: {
    remove: 'value' // Set this to 'value' if you don't want to remove the whole doc but only the reference
  }
}
```

```js
YourSchema.plugin(mongooseCleanup, {
  relations: [
    { model: "SomeOtherModel", key: "author" },
    { model: "RandomModel", key: "user" }
  ]
});
```

#### debug

You can enable logging of all operations by setting `debug` to true

## License

[The MIT License](http://opensource.org/licenses/MIT)
Copyright (c) Carsten Jacobsen
