const { deepStrictEqual, strictEqual } = require('assert')
const { resolve } = require('path')
const { describe, it } = require('mocha')
const rdf = require('@rdfjs/data-model')
const TermSet = require('@rdfjs/term-set')
const FlatFilenameResolver = require('../lib/FlatFilenameResolver')

const defaultBaseIRI = 'http://example.org/'
const defaultPath = resolve(__dirname, 'support/flat')

function createDefault () {
  return new FlatFilenameResolver({
    baseIRI: defaultBaseIRI,
    factory: rdf,
    path: defaultPath
  })
}

describe('FlatFilenameResolver', () => {
  it('should be a constructor', () => {
    strictEqual(typeof FlatFilenameResolver, 'function')
  })

  describe('.graphs', () => {
    it('should be a method', () => {
      const resolver = createDefault()

      strictEqual(typeof resolver.graphs, 'function')
    })

    it('should return a TermSet', async () => {
      const result = await createDefault().graphs()

      strictEqual(result instanceof TermSet, true)
    })

    it('should return a TermSet which contains the given existing graph', async () => {
      const graph = rdf.defaultGraph()

      const result = await createDefault().graphs(graph)

      strictEqual(result.size, 1)
      strictEqual(result.has(graph), true)
    })

    it('should return a TermSet which contains nothing if a non-existing graph is given', async () => {
      const graph = rdf.namedNode('http://idontexist.org/')

      const result = await createDefault().graphs(graph)

      strictEqual(result.size, 0)
    })

    it('should list all named graphs if no graph argument is given', async () => {
      const graphs = await createDefault().graphs()

      strictEqual(graphs.has(rdf.defaultGraph()), true)
      strictEqual(graphs.has(rdf.namedNode(defaultBaseIRI)), true)
      strictEqual(graphs.has(rdf.namedNode(`${defaultBaseIRI}a`)), true)
      strictEqual(graphs.has(rdf.namedNode(`${defaultBaseIRI}a/b`)), true)
    })
  })

  describe('.resolve', () => {
    it('should be a method', () => {
      const resolver = createDefault()

      strictEqual(typeof resolver.resolve, 'function')
    })

    it('should return a string', async () => {
      const graph = rdf.defaultGraph()

      const result = await createDefault().resolve(graph)

      strictEqual(typeof result, 'string')
    })

    it('should return the path to the default file if default graph is given', async () => {
      const graph = rdf.defaultGraph()

      const result = await createDefault().resolve(graph)

      deepStrictEqual(result, resolve(defaultPath, '__default.nt'))
    })

    it('should return the path to the index file if the given graph is the baseIRI', async () => {
      const graph = rdf.namedNode(defaultBaseIRI)

      const result = await createDefault().resolve(graph)

      deepStrictEqual(result, resolve(defaultPath, '__index.nt'))
    })

    it('should return the path to the file for the given named node', async () => {
      const graph = rdf.namedNode(`${defaultBaseIRI}a/b`)

      const result = await createDefault().resolve(graph)

      deepStrictEqual(result, resolve(defaultPath, 'a%2Fb.nt'))
    })

    it('should throw an error if a given NamedNode graph doesn\'t match the baseIRI', async () => {
      let error = null
      const graph = rdf.namedNode('http://other.org/')

      try {
        await createDefault().resolve(graph)
      } catch (err) {
        error = err
      }

      strictEqual(error.message.includes('namespace'), true)
    })
  })
})
