import { strictEqual } from 'node:assert'
import { describe, it } from 'mocha'
import FlatMultiFileStore from '../FlatMultiFileStore.js'

describe('FlatMultiFileStore', () => {
  it('should forward the extension argument to the resolver', () => {
    const store = new FlatMultiFileStore({
      extension: 'foo'
    })

    strictEqual(store.datastore.resolver.extension, 'foo')
  })
})
