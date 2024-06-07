import fs from 'node:fs'
import { promisify } from 'node:util'
import rdf from 'rdf-ext'

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

      const dataset = await rdf.io.dataset.fromURL(filename)

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

    await rdf.io.dataset.toURL(filename, dataset)
  }
}

export default MultiFileDatasetStore
