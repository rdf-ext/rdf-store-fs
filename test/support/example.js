import rdf from 'rdf-ext'

const baseIRI = 'http://example.org/'

const quads = {
  _: rdf.quad(
    rdf.namedNode(baseIRI),
    rdf.namedNode(`${baseIRI}predicate`),
    rdf.literal('object'),
    rdf.defaultGraph()
  ),
  root: rdf.quad(
    rdf.namedNode(baseIRI),
    rdf.namedNode(`${baseIRI}predicate`),
    rdf.literal('root'),
    rdf.namedNode(baseIRI)
  ),
  a: rdf.quad(
    rdf.namedNode(`${baseIRI}a`),
    rdf.namedNode(`${baseIRI}predicate`),
    rdf.literal('object'),
    rdf.namedNode(`${baseIRI}a`)
  ),
  ab: rdf.quad(
    rdf.namedNode(`${baseIRI}a/b`),
    rdf.namedNode(`${baseIRI}predicate`),
    rdf.literal('object'),
    rdf.namedNode(`${baseIRI}a/b`)
  )
}

const toDataset = () => rdf.dataset([quads._, quads.root, quads.a, quads.ab])
const toStream = () => toDataset().toStream()

export {
  baseIRI,
  quads,
  toDataset,
  toStream
}
