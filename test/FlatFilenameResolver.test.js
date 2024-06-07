import { deepStrictEqual, strictEqual } from 'node:assert'
import { resolve } from 'node:path'
import { describe, it } from 'mocha'
import rdf from 'rdf-ext'
import FlatFilenameResolver from '../lib/FlatFilenameResolver.js'

const defaultBaseIRI = 'http://example.org/'
const defaultPath = new URL('support/flat', import.meta.url).pathname

function createDefault (overrides = {}) {
  return new FlatFilenameResolver({
    baseIRI: defaultBaseIRI,
    factory: rdf,
    path: defaultPath,
    ...overrides
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

      strictEqual(typeof result.has, 'function')
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

      const result = await createDefault({ extension: 'ttl' }).resolve(graph)

      deepStrictEqual(result, resolve(defaultPath, '__default.ttl'))
    })

    it('should return the path to the default file if default graph is given with changed extension', async () => {
      const graph = rdf.defaultGraph()

      const result = await createDefault().resolve(graph)

      deepStrictEqual(result, resolve(defaultPath, '__default.nt'))
    })

    it('should return the path to the index file if the given graph is the baseIRI', async () => {
      const graph = rdf.namedNode(defaultBaseIRI)

      const result = await createDefault().resolve(graph)

      deepStrictEqual(result, resolve(defaultPath, '__index.nt'))
    })

    it('should return the path to the index file if the given graph is the baseIRI with change extension', async () => {
      const graph = rdf.namedNode(defaultBaseIRI)

      const result = await createDefault({ extension: 'ttl' }).resolve(graph)

      deepStrictEqual(result, resolve(defaultPath, '__index.ttl'))
    })

    it('should return the path to the file for the given named node', async () => {
      const graph = rdf.namedNode(`${defaultBaseIRI}a/b`)

      const result = await createDefault().resolve(graph)

      deepStrictEqual(result, resolve(defaultPath, 'a%2Fb.nt'))
    })

    it('should return the path to the file for the given named node with changed extension', async () => {
      const graph = rdf.namedNode(`${defaultBaseIRI}a/b`)

      const result = await createDefault({ extension: 'ttl' }).resolve(graph)

      deepStrictEqual(result, resolve(defaultPath, 'a%2Fb.ttl'))
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
