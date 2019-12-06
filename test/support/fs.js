const fs = require('fs')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const { promisify } = require('util')

const copyFile = promisify(fs.copyFile)
const createReadStream = fs.createReadStream
const exists = async path => {
  try {
    await promisify(fs.access)(path, fs.constants.R_OK)
  } catch (err) {
    return false
  }

  return true
}
const mkdir = promisify(mkdirp)
const readFile = promisify(fs.readFile)
const rmdir = promisify(rimraf)
const writeFile = promisify(fs.writeFile)

module.exports = {
  copyFile,
  createReadStream,
  exists,
  mkdir,
  readFile,
  rmdir,
  writeFile
}
