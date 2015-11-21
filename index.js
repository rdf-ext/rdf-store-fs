module.exports = FileStore

var bluebird = require('bluebird')
var folderToRdf = require('folder-to-rdf')
var fs = require('fs-extra')
var path = require('path')
var url = require('url')
var util = require('util')
var AbstractStore = require('rdf-store-abstract')
var N3Parser = require('rdf-parser-n3')
var NTriplesSerializer = require('rdf-serializer-ntriples')

var mkdirp = bluebird.promisify(fs.mkdirp)
var readFile = bluebird.promisify(fs.readFile)
var stat = bluebird.promisify(fs.stat)
var unlink = bluebird.promisify(fs.unlink)
var writeFile = bluebird.promisify(fs.writeFile)

function writeFileRecursively (file, contents) {
  return mkdirp(path.dirname(file)).then(function () {
    return writeFile(file, contents)
  })
}

function FileStore (rdf, options) {
  AbstractStore.call(this, options)

  var self = this

  options = options || {}

  self.parser = options.parse || N3Parser
  self.serializer = options.serialize || NTriplesSerializer
  self.path = options.path || '.'
  self.graphFolder = bluebird.promisify(options.graphFolder || folderToRdf(options))
  self.graphFile = options.graphFile || function (p) {
    return p.pathname.split('/').slice(1).join('_') + '.ttl'
  }
}

util.inherits(FileStore, AbstractStore)

FileStore.prototype.graphPath = function (iri) {
  return path.join(this.path, this.graphFile(url.parse(iri)))
}

FileStore.prototype.graph = function (iri, callback) {
  var self = this

  return new Promise(function (resolve, reject) {
    callback = callback || function () {}

    var graphPath = self.graphPath(iri)

    // TODO maybe use good heuristics
    // since we call fs.stats twice
    stat(graphPath).then(function (stats) {
      return Promise.resolve().then(function () {
        if (stats.isFile()) {
          // Read the file
          return readFile(graphPath, 'utf8').then(function (data) {
            return self.parser.parse(data.toString(), null, iri)
          })
        } else {
          // Or list container
          return self.graphFolder(graphPath)
        }
      }).then(function (graph) {
        callback(null, graph)
        resolve(graph)
      }).catch(function (error) {
        callback(error)
        reject(error)
      })
    }).catch(function () {
      callback()
      reject()
    })
  })
}

FileStore.prototype.add = function (iri, graph, callback) {
  var self = this

  return new Promise(function (resolve, reject) {
    callback = callback || function () {}

    self.serializer.serialize(graph).then(function (serialized) {
      return writeFileRecursively(self.graphPath(iri), serialized)
    }).then(function () {
      callback(null, graph)
      resolve(graph)
    }).catch(function (error) {
      callback(error)
      reject(error)
    })
  })
}

FileStore.prototype.delete = function (iri, callback) {
  var self = this

  return new Promise(function (resolve, reject) {
    callback = callback || function () {}
    stat(self.graphPath(iri))
    .then(function (result) {
      return unlink(self.graphPath(iri))
    })
    .then(function (result) {
      callback(null, true)
      resolve(true)
    }).catch(function (error) {
      if (error.code === 'ENOENT') {
        callback(null, false)
        return resolve(false)
      }
      callback(error)
      reject(error)
    })
  })
}
