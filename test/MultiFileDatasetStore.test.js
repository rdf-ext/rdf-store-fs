const { deepStrictEqual, strictEqual } = require('assert')
const fs = require('./support/fs')
const { resolve } = require('path')
const { describe, it } = require('mocha')
const quads = require('./support/quads')
const rdf = { ...require('@rdfjs/data-model'), ...require('@rdfjs/dataset') }
const FlatFilenameResolver = require('../lib/FlatFilenameResolver')
const MultiFileDatasetStore = require('../lib/MultiFileDatasetStore')

function createDefault ({ path = resolve(__dirname, 'support/flat') } = {}) {
  return new MultiFileDatasetStore({
    factory: rdf,
    resolver: new FlatFilenameResolver({
      baseIRI: quads.baseIRI,
      factory: rdf,
      path
    })
  })
}

describe('MultiFileDatasetStore', () => {
  it('should be a constructor', () => {
    strictEqual(typeof MultiFileDatasetStore, 'function')
  })

  describe('.graphs', () => {
    it('should be a function', () => {
      const store = createDefault()

      strictEqual(typeof store.graphs, 'function')
    })

    it('should list all available graphs', async () => {
      const graphs = await createDefault().graphs()

      strictEqual(graphs.has(rdf.defaultGraph()), true)
      strictEqual(graphs.has(rdf.namedNode(quads.baseIRI)), true)
      strictEqual(graphs.has(rdf.namedNode(`${quads.baseIRI}a`)), true)
      strictEqual(graphs.has(rdf.namedNode(`${quads.baseIRI}a/b`)), true)
    })
  })

  describe('.read', () => {
    it('should be a function', () => {
      const store = createDefault()

      strictEqual(typeof store.read, 'function')
    })

    it('should return a dataset', async () => {
      const graph = rdf.defaultGraph()

      const result = await createDefault().read(graph)

      strictEqual(typeof result.size, 'number')
      strictEqual(typeof result.match, 'function')
    })

    it('should read the content of the default graph file', async () => {
      const graph = rdf.defaultGraph()

      const result = await createDefault().read(graph)

      strictEqual(result.size, 1)
      strictEqual(result.has(quads._), true)
    })

    it('should read the content of a named graph file', async () => {
      const graph = rdf.namedNode(`${quads.baseIRI}a`)

      const result = await createDefault().read(graph)

      strictEqual(result.size, 1)
      strictEqual(result.has(quads.a), true)
    })

    it('should return an empty dataset for non-existing graphs', async () => {
      const graph = rdf.namedNode(`${quads.baseIRI}z`)

      const result = await createDefault().read(graph)

      strictEqual(result.size, 0)
    })
  })

  describe('.write', () => {
    it('should be a function', () => {
      const store = createDefault()

      strictEqual(typeof store.write, 'function')
    })

    it('should be async', async () => {
      const graph = rdf.defaultGraph()
      const path = resolve(__dirname, 'support/tmp/async')
      const store = await createDefault({ path })

      await fs.mkdir(path, { recursive: true })

      const result = store.write(graph, rdf.dataset([quads._]))

      await fs.rmdir(path)

      strictEqual(typeof result.then, 'function')
    })

    it('should write the dataset to the resolved file', async () => {
      const graph = rdf.defaultGraph()
      const expected = resolve(__dirname, 'support/flat')
      const path = resolve(__dirname, 'support/tmp/files')
      const store = await createDefault({ path })

      await fs.mkdir(path, { recursive: true })

      await store.write(graph, rdf.dataset([quads._]))

      deepStrictEqual(await fs.readFile(resolve(path, '__default.nt')), await fs.readFile(resolve(expected, '__default.nt')))

      await fs.rmdir(path)
    })

    it('should remove the file if the dataset is empty', async () => {
      const graph = rdf.defaultGraph()
      const path = resolve(__dirname, 'support/tmp/files')
      const store = await createDefault({ path })

      await fs.mkdir(path, { recursive: true })

      await store.write(graph, rdf.dataset())

      strictEqual(await fs.exists(resolve(path, '__default.nt')), false)

      await fs.rmdir(path)
    })
  })
})
