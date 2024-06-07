import FlatFilenameResolver from './lib/FlatFilenameResolver.js'
import MultiFileStore from './MultiFileStore.js'

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

export default FlatMultiFileStore
