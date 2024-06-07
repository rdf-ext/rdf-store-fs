# rdf-store-fs

[![build status](https://img.shields.io/github/actions/workflow/status/rdf-ext/rdf-store-fs/test.yaml?branch=master)](https://github.com/rdf-ext/rdf-store-fs/actions/workflows/test.yaml)
[![npm version](https://img.shields.io/npm/v/rdf-store-fs.svg)](https://www.npmjs.com/package/rdf-store-fs)

Filesystem based RDF Store that follows the [RDF/JS: Stream interfaces](https://rdf.js.org/stream-spec/#store-interface) specification.

## Install

```
npm install --save rdf-store-fs
```

## Usage

The package provides classes to implement file stores and comes with easy to use default implementations.

### FlatMultiFileStore

The `FlatMultiFileStore` implements a file store that writes each named graph to a separate file in a flat folder structure.
It is only possible to use named graphs from the given `baseIRI`.
Reading or writing a graph to a different namespace will cause an error. 

It can be imported with the following line of code:

```js
const FlatMultiFileStore = require('rdf-store-fs/FlatMultiFileStore')
````

The following options are supported:

- `baseIRI`: The base IRI for the named graphs as a string.
- `path`: The path to the files for the store as a string.

## Example

The following example creates a `FlatMultiFileStore` file store which writes it's files into the example folder.
The quads from the `input` stream are written to the store.
As the named graph is the same as the `baseIRI`, the quads are written to `__index.nt`.

```js
const rdf = require('@rdfjs/data-model')
const { Readable } = require('readable-stream')
const FlatMultiFileStore = require('rdf-store-fs/FlatMultiFileStore')

const input = Readable({
  objectMode: true,
  read: function () {
    this.push(rdf.quad(
      rdf.namedNode('http://example.org/subject1'),
      rdf.namedNode('http://www.w3.org/2000/01/rdf-schema#label'),
      rdf.literal('this will be written to the file store'),
      rdf.namedNode('http://example.org/')
    ))

    this.push(null)
  }
})

const store = new FlatMultiFileStore({
  baseIRI: 'http://example.org/',
  path: __dirname
})

const event = store.import(input)

event.on('end', () => {
  console.log('triples written to the file store')
})
```
