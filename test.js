const test = require('ava');
const graphling = require('./index.js')

test("simples", t => {
  const store = graphling()
  store.link("a", "ab", "b")
  store.link("b", "bc", "c")
  store.link("c", "ca", "a")

  t.deepEqual(store.neighbors(null), [])
  console.log("hello")
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
  const store = graphling()
  const a = {coolness: 4}
  const b = {coolness: 55}
  const c = {coolness: 2}
  const ab = [1, 2, 3]
  const bc = [4, 5, 6]
  const ca = [7, 8, 9]
  store.link(a, ab, b)
  store.link(b, bc, c)
  store.link(c, ca, a)

  const triples = []
  for (const trip of store) {
    triples.push(trip)
  }
  t.deepEqual(triples, [
    [a, ab, b],
    [b, bc, c],
    [c, ca, a]
  ])

  t.deepEqual(store.neighbors(a), [b, c])
  store.unlink(c, ca, a)
  b.quickness = "very fast"
  t.deepEqual(store.neighbors(a), [b])
  t.deepEqual(store.neighbors(a)[0].quickness, "very fast")
  t.deepEqual(store.relationships(b), [bc, ab])
  t.deepEqual(store.relationships(b)[0][0], 4)
})

test("hyperedges", t => {
  const store = graphling()
  store.link("a", "link", "b")
  store.link("a", "link", "c")
  store.link("c", "link", "c")

  const triples = []
  for (const trip of store) {
    triples.push(trip)
  }
  t.deepEqual(triples, [
    ["a", "link", "b"],
    ["a", "link", "c"],
    ["c", "link", "c"]
  ])

  t.deepEqual(store.neighbors("a"), ["b", "c"])
  t.deepEqual(store.neighbors("c"), ["c", "a"])
  t.deepEqual(store.neighbors("c", {incoming: false}), ["c"])
  t.deepEqual(store.neighbors("c", {outgoing: false}), ["a", "c"])

  t.deepEqual(store.relationships("c"), ["link"])

  t.deepEqual(store.nodes("link"), ["a", "c", "b"])
  t.deepEqual(store.nodes("link", {targets: false}), ["a", "c"])
  t.deepEqual(store.nodes("link", {origins: false}), ["b", "c"])
})

test("multilinks", t => {
  const store = graphling()

  const arr = [1, 2, 3]
  const obj = {coolness: 58}
  const sym = Symbol()
  store.link("a", "link", "b")
  store.link("a", arr, "b")
  store.link("a", obj, "b")
  store.link("a", sym, "b")

  t.deepEqual(store.neighbors("a"), ["b"])
  t.deepEqual(store.relationships("a"), ["link", arr, obj, sym])
  t.deepEqual(store.nodes(arr), ["a", "b"])

  store.unlink("a", "link", "b")
  t.deepEqual(store.neighbors("a"), ["b"])
  t.deepEqual(store.relationships("a"), [arr, obj, sym])
  t.deepEqual(store.nodes(arr), ["a", "b"])
})
