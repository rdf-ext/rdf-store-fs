const rdf = require('@rdfjs/data-model')
const { Readable } = require('readable-stream')
const FlatMultiFileStore = require('../FlatMultiFileStore')

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
