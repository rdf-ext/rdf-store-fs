const MultiFileStore = require('./MultiFileStore')
const FlatFilenameResolver = require('./lib/FlatFilenameResolver')

class FlatMultiFileStore extends MultiFileStore {
  constructor ({ baseIRI, factory, path }) {
    super({
      factory,
      resolver: new FlatFilenameResolver({
        baseIRI,
        factory,
        path
      })
    })
  }
}

module.exports = FlatMultiFileStore
