/* global describe, it */
var assert = require('assert')
var fs = require('fs')
var rdf = require('rdf-ext')
var FileStore = require('../')

var simpleGraph = rdf.createGraph([
  rdf.createTriple(
    rdf.createNamedNode('http://example.org/subject'),
    rdf.createNamedNode('http://example.org/predicate'),
    rdf.createLiteral('object'))])

describe('FileStore', function () {
  describe('core', function () {
    it('should implemented all store methods', function () {
      var store = new FileStore(rdf)

      assert.equal(typeof store.add, 'function')
      assert.equal(typeof store.delete, 'function')
      assert.equal(typeof store.graph, 'function')
    })

    it('should provide a default implementation for graphPath', function () {
      var store = new FileStore(rdf)

      assert.equal(typeof store.graphPath, 'function')
    })
  })

  describe('callback API', function () {
    it('.add should create a graph', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      try {
        fs.unlinkSync('./test/support/added.ttl')
      } catch (e) {}

      store.add('http://example.org/added', simpleGraph, function (error, graph) {
        assert(!error)
        assert(simpleGraph.equals(graph))
        assert(fs.existsSync('./test/support/added.ttl'))

        done()
      })
    })

    it('.add should handle error', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      try {
        fs.unlinkSync('./test/support/added.ttl')
      } catch (e) {}

      store.add('http://example.org/notadded', null, function (error) {
        assert(error)
        assert(!fs.existsSync('./test/support/notadded.ttl'))

        done()
      })
    })

    it('.delete should delete a graph', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      try {
        fs.writeFileSync('./test/support/todelete.ttl', '<http://example.org/subject> <http:/>/example.org/predicate> "object" .')
      } catch (e) {}

      store.delete('http://example.org/todelete', function (error, graph) {
        assert(!error)
        assert(!fs.existsSync('./test/support/todelete.ttl'))

        done()
      })
    })

    it('.graph should return a graph object', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      store.graph('http://example.org/graph', function (error, graph) {
        assert(!error)
        assert.equal(typeof graph, 'object')

        done()
      })
    })

    it('.graph should return null for an unknown graph', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      store.graph('http://example.org/unknown', function (error, graph) {
        assert(!error)
        assert.equal(graph, null)

        done()
      })
    })

    it('.graph should handle parser error', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      store.graph('http://example.org/error', function (error, graph) {
        assert(error)

        done()
      })
    })
  })

  describe('Promise API', function () {
    it('.add should create a graph', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      try {
        fs.unlinkSync('./test/support/added.ttl')
      } catch (e) {}

      store.add('http://example.org/added', simpleGraph).then(function (graph) {
        assert(simpleGraph.equals(graph))
        assert(fs.existsSync('./test/support/added.ttl'))

        done()
      }).catch(function (error) {
        done(error)
      })
    })

    it('.add should handle error', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      try {
        fs.unlinkSync('./test/support/added.ttl')
      } catch (e) {}

      store.add('http://example.org/notadded', null).then(function () {
        done('no error thrown')
      }).catch(function () {
        assert(!fs.existsSync('./test/support/notadded.ttl'))

        done()
      })
    })

    it('.delete should delete a graph', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      try {
        fs.writeFileSync('./test/support/todelete.ttl', '<http://example.org/subject> <http:/>/example.org/predicate> "object" .')
      } catch (e) {}

      store.delete('http://example.org/todelete').then(function (graph) {
        assert(!fs.existsSync('./test/support/todelete.ttl'))

        done()
      }).catch(function (error) {
        done(error)
      })
    })

    it('.graph should return a graph object', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      store.graph('http://example.org/graph').then(function (graph) {
        assert.equal(typeof graph, 'object')

        done()
      }).catch(function (error) {
        done(error)
      })
    })

    it('.graph should return null for an unknown graph', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      store.graph('http://example.org/unknown').then(function (graph) {
        assert.equal(graph, null)

        done()
      }).catch(function (error) {
        done(error)
      })
    })

    /* it('.graph should handle parser error', function (done) {
      var store = new FileStore(rdf, {path: './test/support'})

      store.graph('http://example.org/error').then(function () {
        done('no error thrown')
      }).catch(function () {
        done()
      })
    }) */
  })
})
