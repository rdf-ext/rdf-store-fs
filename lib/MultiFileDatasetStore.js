const fs = require('fs')
const { promisify } = require('util')
const { fromStream, toStream } = require('rdf-dataset-ext')
const { fromFile, toFile } = require('rdf-utils-fs')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }

class MultiFileDatasetStore {
  constructor ({ factory = rdf, resolver }) {
    this.factory = factory
    this.resolver = resolver
  }

  async graphs () {
    return this.resolver.graphs()
  }

  async read (graph) {
    try {
      const filename = await this.resolver.resolve(graph)

      // check if the file is readable, otherwise it's treated like an empty graph in catch
      await promisify(fs.access)(filename, fs.constants.R_OK)

      const stream = fromFile(filename, { factory: this.factory })
      const dataset = await fromStream(this.factory.dataset(), stream)

      return this.factory.dataset([...dataset].map(quad => {
        return this.factory.quad(quad.subject, quad.predicate, quad.object, graph)
      }))
    } catch (err) {
      return rdf.dataset()
    }
  }

  async write (graph, dataset) {
    const filename = await this.resolver.resolve(graph)

    if (dataset.size === 0) {
      try {
        await promisify(fs.unlink)(filename)
      } catch (err) {}

      return
    }

    dataset = this.factory.dataset([...dataset].map(quad => {
      return this.factory.quad(quad.subject, quad.predicate, quad.object)
    }))

    await toFile(toStream(dataset), filename)
  }
}

module.exports = MultiFileDatasetStore
