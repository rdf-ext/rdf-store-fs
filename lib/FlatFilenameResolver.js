import { basename, resolve } from 'node:path'
import { glob } from 'glob'
import rdf from 'rdf-ext'

class FlatFilenameResolver {
  constructor ({ baseIRI, factory = rdf, path, extension = 'nt' }) {
    this.baseIRI = baseIRI
    this.factory = factory
    this.path = path
    this.extension = extension
  }

  async graphs (graph) {
    const filenames = await glob(resolve(this.path, `*.${this.extension}`))

    const graphs = rdf.termSet(filenames.map(filename => {
      const shortFilename = decodeURIComponent(basename(filename, `.${this.extension}`))

      if (shortFilename === '__default') {
        return this.factory.defaultGraph()
      }

      if (shortFilename === '__index') {
        return this.factory.namedNode(this.baseIRI)
      }

      return this.factory.namedNode(`${this.baseIRI}${decodeURIComponent(basename(filename, `.${this.extension}`))}`)
    }))

    if (graph) {
      return rdf.termSet(graphs.has(graph) ? [graph] : [])
    }

    return graphs
  }

  async resolve (graph) {
    if (graph.termType === 'DefaultGraph') {
      return resolve(this.path, `__default.${this.extension}`)
    }

    if (graph.value === this.baseIRI) {
      return resolve(this.path, `__index.${this.extension}`)
    }

    if (!graph.value.startsWith(this.baseIRI)) {
      throw new Error(`graph is outside the baseIRI namespace: ${this.baseIRI}`)
    }

    const url = new URL(graph.value)

    return resolve(this.path, `${encodeURIComponent(url.pathname.slice(1))}.${this.extension}`)
  }
}

export default FlatFilenameResolver
