const { EventEmitter } = require('events')

function promiseToEvent (promise) {
  const event = new EventEmitter()

  promise
    .then(() => event.emit('end'))
    .catch(err => event.emit('error', err))

  return event
}

module.exports = promiseToEvent
