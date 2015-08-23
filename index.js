module.exports = FileStore;

var
  fs = require('fs'),
  path = require('path'),
  url = require('url'),
  AbstractStore = require('rdf-store-abstract'),
  mkdirp = require('fs-extra').mkdirp;

function FileStore (rdf, options) {
  if (options == null) {
    options = {};
  }

  var self = this;

  this.parse = 'parser' in options ? options.parse : rdf.parseTurtle;
  this.serialize = 'serialize' in options ? options.serialize : rdf.serializeNTriples;
  this.path = 'path' in options ? options.path : '.';
  this.graphFile = 'graphFile' in options ? options.graphFile : function (p) {
    return p.pathname.split('/').slice(1).join('_') + '.ttl';
  };

  var graphPath = function (iri) {
    var parsed = url.parse(iri);

    return path.join(self.path, self.graphFile(parsed));
  };

  var graphExists = function (iri) {
    return fs.existsSync(graphPath(iri));
  };

  this.graph = function (iri, callback) {
    if (!graphExists(iri)) {
      return callback(null);
    }

    fs.readFile(graphPath(iri), 'utf8', function (err, data) {
      if (err) return callback(null, err);

      self.parse(
        data.toString(),
        callback,
        iri);
    });
  };

  this.add = function (iri, graph, callback) {
    self.serialize(
      graph,
      function (serialized) {
        writeFileRecursively(graphPath(iri), serialized, function (err) {
          if (err) return callback(null, err);
          callback(graph);
        });
      }, iri);
  };

  this.delete = function (iri, callback) {
    if (graphExists(iri)) {
      fs.unlink(graphPath(iri), function (err) {
        if (err) return callback(null, err);
        callback(true);
      });
    }
  };
}

function writeFileRecursively (file, contents, callback) {
  mkdirp(path.dirname(file), function (err) {
    if (err) return callback(err);
    return fs.writeFile(file, contents, callback);
  });
}

FileStore.prototype = new AbstractStore();
FileStore.prototype.constructor = FileStore;
