const MultiFileStore = require('./MultiFileStore')
const FlatFilenameResolver = require('./lib/FlatFilenameResolver')

class FlatMultiFileStore extends MultiFileStore {
  constructor ({ baseIRI, factory, path, extension }) {
    super({
      factory,
      resolver: new FlatFilenameResolver({
        baseIRI,
        factory,
        path,
        extension
      })
    })
  }
}

module.exports = FlatMultiFileStore
