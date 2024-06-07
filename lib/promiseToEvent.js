import { EventEmitter } from 'node:events'

function promiseToEvent (promise) {
  const event = new EventEmitter()

  promise
    .then(() => event.emit('end'))
    .catch(err => event.emit('error', err))

  return event
}

export default promiseToEvent
