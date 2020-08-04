const test = require('ava');
const graphling = require('./index.js')

test("simples", t => {
  store = graphling()
  store.link("a", "ab", "b")
  store.link("b", "bc", "c")
  store.link("c", "ca", "a")

  t.deepEqual(store.neighbors(null), [])
  t.deepEqual(store.neighbors("a"), ["b", "c"])
  t.deepEqual(store.neighbors("a", {incoming: false}), ["b"])
  t.deepEqual(store.neighbors("a", {outgoing: false}), ["c"])

  t.deepEqual(store.relationships("b"), ["bc", "ab"])
  t.deepEqual(store.relationships("b", {incoming: false}), ["bc"])
  t.deepEqual(store.relationships("b", {outgoing: false}), ["ab"])

  t.deepEqual(store.nodes("ab"), ["a", "b"])
  t.deepEqual(store.nodes("ab", {origins: false}), ["b"])
  t.deepEqual(store.nodes("ab", {targets: false}), ["a"])

  store.unlink("c", "ca", "a")
  t.deepEqual(store.neighbors("a"), ["b"])
  t.deepEqual(store.neighbors("a", {incoming: false}), ["b"])
  t.deepEqual(store.neighbors("a", {outgoing: false}), [])
  t.deepEqual(store.nodes("ca"), [])
})

test("objects", t => {
  store = graphling()
  a = {coolness: 4}
  b = {coolness: 55}
  c = {coolness: 2}
  ab = [1, 2, 3]
  bc = [4, 5, 6]
  ca = [7, 8, 9]
  store.link(a, ab, b)
  store.link(b, bc, c)
  store.link(c, ca, a)

  t.deepEqual(store.neighbors(a), [b, c])
  store.unlink(c, ca, a)
  b.quickness = "very fast"
  t.deepEqual(store.neighbors(a), [b])
  t.deepEqual(store.neighbors(a)[0].quickness, "very fast")
})
