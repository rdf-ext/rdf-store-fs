import fs from 'node:fs'
import { promisify } from 'node:util'
import { mkdirp } from 'mkdirp'
import { rimraf } from 'rimraf'

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
const mkdir = mkdirp
const readFile = promisify(fs.readFile)
const rmdir = rimraf
const writeFile = promisify(fs.writeFile)

export {
  copyFile,
  createReadStream,
  exists,
  mkdir,
  readFile,
  rmdir,
  writeFile
}
