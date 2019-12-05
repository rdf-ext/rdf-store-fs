const { basename, resolve } = require('path')
const { URL } = require('url')
const { promisify } = require('util')
const glob = require('glob')
const rdf = require('@rdfjs/data-model')
const TermSet = require('@rdfjs/term-set')

class FlatFilenameResolver {
  constructor ({ baseIRI, factory = rdf, path }) {
    this.baseIRI = baseIRI
    this.factory = factory
    this.path = path
  }

  async graphs (graph) {
    const filenames = await promisify(glob)(resolve(this.path, '*.nt'))

    const graphs = new TermSet(filenames.map(filename => {
      const shortFilename = decodeURIComponent(basename(filename, '.nt'))

      if (shortFilename === '__default') {
        return this.factory.defaultGraph()
      }

      if (shortFilename === '__index') {
        return this.factory.namedNode(this.baseIRI)
      }

      return this.factory.namedNode(`${this.baseIRI}${decodeURIComponent(basename(filename, '.nt'))}`)
    }))

    if (graph) {
      return new TermSet(graphs.has(graph) ? [graph] : [])
    }

    return graphs
  }

  async resolve (graph) {
    if (graph.termType === 'DefaultGraph') {
      return resolve(this.path, '__default.nt')
    }

    if (graph.value === this.baseIRI) {
      return resolve(this.path, '__index.nt')
    }

    if (!graph.value.startsWith(this.baseIRI)) {
      throw new Error(`graph is outside the baseIRI namespace: ${this.baseIRI}`)
    }

    const url = new URL(graph.value)

    return resolve(this.path, `${encodeURIComponent(url.pathname.slice(1))}.nt`)
  }
}

module.exports = FlatFilenameResolver
