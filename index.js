module.exports = FileStore;

var inherits = require('util').inherits;
var path = require('path');
var folderToRdf = require('folder-to-rdf');

var
  fs = require('fs'),
  path = require('path'),
  url = require('url'),
  AbstractStore = require('rdf-store-abstract'),
  mkdirp = require('fs-extra').mkdirp;

function writeFileRecursively (file, contents, callback) {
  mkdirp(path.dirname(file), function (err) {
    if (err) return callback(err);
    return fs.writeFile(file, contents, callback);
  });
}

function FileStore (rdf, options) {
  AbstractStore.call(this, options);

  var self = this;

  if (options == null) {
    options = {};
  }

  self.parse = options.parse || rdf.parseTurtle;
  self.serialize = options.serialize || rdf.serializeNTriples;
  self.path = options.path || '.';
  self.graphFolder = options.graphFolder || folderToRdf(options);
  self.graphFile = options.graphFile || function (p) {
    return p.pathname.split('/').slice(1).join('_') + '.ttl';
  };
}

FileStore.prototype.graphPath = function (iri) {
  var parsed = url.parse(iri);
  return path.join(this.path, this.graphFile(parsed));
};

FileStore.prototype.graphExists = function (iri) {
  return fs.existsSync(this.graphPath(iri));
};

FileStore.prototype.graph = function (iri, callback, options) {
  var self = this;


  var graphPath = self.graphPath(iri)

  // TODO maybe use good heuristics
  // since we call fs.stats twice
  fs.stats(graphPath, function (err, stats) {
    if (err) return callback(null, err);

    // Read the file
    if (stats.isFile()) {
      fs.readFile(graphPath, 'utf8', function (err, data) {
        if (err) return callback(null, err);

        self.parse(
          data.toString(),
          callback,
          iri);
      });
    }
    // Or list container
    else {
      self.graphFolder(graphPath, function(err, graph) {
        return callback(graph, err);
      });
    }
  });
};

FileStore.prototype.add = function (iri, graph, callback) {
  var self = this;

  self.serialize(
    graph,
    function (serialized) {
      writeFileRecursively(self.graphPath(iri), serialized, function (err) {
        if (err) return callback(null, err);
        callback(graph);
      });
    }, iri);
};

FileStore.prototype.delete = function (iri, callback) {
  var self = this;

  if (self.graphExists(iri)) {
    fs.unlink(self.graphPath(iri), function (err) {
      if (err) return callback(null, err);
      callback(true);
    });
  }
};
