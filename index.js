module.exports = FileStore

var util = require('util').util
var path = require('path')
var folderToRdf = require('folder-to-rdf')

var fs = require('fs')
var url = require('url')
var AbstractStore = require('rdf-store-abstract')
var mkdirp = require('fs-extra').mkdirp

function writeFileRecursively (file, contents, callback) {
  mkdirp(path.dirname(file), function (err) {
    if (err) return callback(err)
    return fs.writeFile(file, contents, callback)
  })
}

function FileStore (rdf, options) {
  AbstractStore.call(this, options)

  var self = this

  if (options == null) {
    options = {}
  }

  self.parse = options.parse || rdf.parseTurtle
  self.serialize = options.serialize || rdf.serializeNTriples
  self.path = options.path || '.'
  self.graphFolder = options.graphFolder || folderToRdf(options)
  self.graphFile = options.graphFile || function (p) {
    return p.pathname.split('/').slice(1).join('_') + '.ttl'
  }
}

util.inherits(FileStore, AbstractStore)

FileStore.prototype.graphPath = function (iri) {
  var parsed = url.parse(iri)
  return path.join(this.path, this.graphFile(parsed))
}

FileStore.prototype.graph = function (iri, callback, options) {
  var self = this
  var graphPath = self.graphPath(iri)

  // TODO maybe use good heuristics
  // since we call fs.stats twice
  fs.stat(graphPath, function (err, stats) {
    if (err) return callback(null, err)

    // Read the file
    if (stats.isFile()) {
      fs.readFile(graphPath, 'utf8', function (err, data) {
        if (err) return callback(null, err)

        self.parse(
          data.toString(),
          callback,
          iri)
      })
    } else { // Or list container
      self.graphFolder(graphPath, function (err, graph) {
        return callback(graph, err)
      })
    }
  })
}

FileStore.prototype.add = function (iri, graph, callback) {
  var self = this

  self.serialize(
    graph,
    function (serialized) {
      writeFileRecursively(self.graphPath(iri), serialized, function (err) {
        if (err) return callback(null, err)
        callback(graph)
      })
    }, iri)
}

FileStore.prototype.delete = function (iri, callback) {
  var self = this

  fs.unlink(self.graphPath(iri), function (err) {
    if (err) return callback(null, err)
    callback(true)
  })
}
