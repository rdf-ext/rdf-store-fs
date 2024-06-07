import { deepStrictEqual, strictEqual } from 'node:assert'
import { resolve } from 'node:path'
import { describe, it } from 'mocha'
import rdf from 'rdf-ext'
import FlatFilenameResolver from '../lib/FlatFilenameResolver.js'
import MultiFileDatasetStore from '../lib/MultiFileDatasetStore.js'
import { baseIRI, quads } from './support/example.js'
import * as fs from './support/fs.js'

function createDefault ({ path = new URL('support/flat', import.meta.url).pathname } = {}) {
  return new MultiFileDatasetStore({
    factory: rdf,
    resolver: new FlatFilenameResolver({
      baseIRI,
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
      strictEqual(graphs.has(rdf.namedNode(baseIRI)), true)
      strictEqual(graphs.has(rdf.namedNode(`${baseIRI}a`)), true)
      strictEqual(graphs.has(rdf.namedNode(`${baseIRI}a/b`)), true)
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
      const graph = rdf.namedNode(`${baseIRI}a`)

      const result = await createDefault().read(graph)

      strictEqual(result.size, 1)
      strictEqual(result.has(quads.a), true)
    })

    it('should return an empty dataset for non-existing graphs', async () => {
      const graph = rdf.namedNode(`${baseIRI}z`)

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
      const path = new URL('support/tmp/async', import.meta.url).pathname
      const store = await createDefault({ path })

      await fs.mkdir(path)

      const result = store.write(graph, rdf.dataset([quads._]))

      await fs.rmdir(path)

      strictEqual(typeof result.then, 'function')
    })

    it('should write the dataset to the resolved file', async () => {
      const graph = rdf.defaultGraph()
      const expected = new URL('support/flat', import.meta.url).pathname
      const path = new URL('support/tmp/files', import.meta.url).pathname
      const store = await createDefault({ path })

      await fs.mkdir(path)

      await store.write(graph, rdf.dataset([quads._]))

      deepStrictEqual(await fs.readFile(resolve(path, '__default.nt')), await fs.readFile(resolve(expected, '__default.nt')))

      await fs.rmdir(path)
    })

    it('should remove the file if the dataset is empty', async () => {
      const graph = rdf.defaultGraph()
      const path = new URL('support/tmp/files', import.meta.url).pathname
      const store = await createDefault({ path })

      await fs.mkdir(path)

      await store.write(graph, rdf.dataset())

      strictEqual(await fs.exists(resolve(path, '__default.nt')), false)

      await fs.rmdir(path)
    })
  })
})
