const { strictEqual } = require('assert')
const { describe, it } = require('mocha')
const { FlatMultiFileStore } = require('../index')

describe('FlatMultiFileStore', () => {
  describe('.ctor', () => {
    it('forwards extension to resolver', () => {
      // given
      const store = new FlatMultiFileStore({
        extension: 'foo'
      })

      // then
      strictEqual(store.datastore.resolver.extension, 'foo')
    })
  })
})
