import { promisify } from 'node:util'
import multistream from 'multistream'
import rdf from 'rdf-ext'
import FilterStream from 'rdf-stream-filter'
import byGraph from 'rdf-stream-to-dataset-stream/byGraph.js'
import { finished, Writable } from 'readable-stream'
import MultiFileDatasetStore from './lib/MultiFileDatasetStore.js'
import promiseToEvent from './lib/promiseToEvent.js'

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

      callback(null, new FilterStream(dataset.toStream(), subject, predicate, object, current))
    })
  }

  import (stream, { truncate = false } = {}) {
    const writer = new Writable({
      objectMode: true,
      write: async (dataset, encoding, callback) => {
        const graph = [...dataset][0].graph

        if (!truncate) {
          dataset.addAll(await this.datastore.read(graph))
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

export default MultiFileStore
