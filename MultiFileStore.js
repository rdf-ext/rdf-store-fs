const { promisify } = require('util')
const multistream = require('multistream')
const { addAll, toStream } = require('rdf-dataset-ext')
const FilterStream = require('rdf-stream-filter')
const byGraph = require('rdf-stream-to-dataset-stream/byGraph')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const { finished, Writable } = require('readable-stream')
const MultiFileDatasetStore = require('./lib/MultiFileDatasetStore')
const promiseToEvent = require('./lib/promiseToEvent')

class MultiFileStore {
  constructor ({ factory = rdf, resolver }) {
    this.datastore = new MultiFileDatasetStore({
      factory,
      resolver
    })
  }

  match (subject, predicate, object, graph) {
    let graphs = graph ? [graph] : null

    return multistream.obj(async callback => {
      if (!graphs) {
        graphs = [...await this.datastore.graphs()]
      }

      const current = graphs.shift()

      if (!current) {
        return callback(null, null)
      }

      const dataset = await this.datastore.read(current)

      callback(null, new FilterStream(toStream(dataset), subject, predicate, object, current))
    })
  }

  import (stream, { truncate = false } = {}) {
    const writer = new Writable({
      objectMode: true,
      write: async (dataset, encoding, callback) => {
        const graph = [...dataset][0].graph

        if (!truncate) {
          addAll(dataset, await this.datastore.read(graph))
        }

        await this.datastore.write(graph, dataset)

        callback()
      }
    })

    stream.pipe(byGraph()).pipe(writer)

    return promiseToEvent(promisify(finished)(writer))
  }

  remove (stream) {
    const writer = new Writable({
      objectMode: true,
      write: async (dataset, encoding, callback) => {
        const graph = [...dataset][0].graph
        const content = await this.datastore.read(graph)

        for (const quad of dataset) {
          if (content.has(quad)) {
            content.delete(quad)
          }
        }

        await this.datastore.write(graph, content)

        callback()
      }
    })

    stream.pipe(byGraph()).pipe(writer)

    return promiseToEvent(promisify(finished)(writer))
  }

  removeMatches (subject, predicate, object, graph) {
    return promiseToEvent((async () => {
      const graphs = graph ? [graph] : [...await this.datastore.graphs()]
      const current = graphs.shift()

      const content = await this.datastore.read(current)

      for (const quad of content.match(subject, predicate, object, current)) {
        content.delete(quad)
      }

      await this.datastore.write(current, content)
    })())
  }

  deleteGraph (graph) {
    return promiseToEvent(this.datastore.write(graph, rdf.dataset()))
  }
}

module.exports = MultiFileStore
