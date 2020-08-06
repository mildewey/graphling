function map_iter(iter, func) {
  result = iter.next()
  map = []
  while (!result.done) {
    map.push(func(result.value))
    result = iter.next();
  }
  return map
}

function identity(val) {
  return val
}

function store() {
  const root = new Map()

  return {
    add: function (a, b, c) {
      let branch = root.get(a)
      if (branch === undefined) {
        branch = new Map()
        root.set(a, branch)
      }
      let leaf = branch.get(b)
      if (leaf === undefined) {
        leaf = new Set()
        branch.set(b, leaf)
      }
      leaf.add(c)
    },
    delete: function (a, b, c) {
      let branch = root.get(a)
      if (branch !== undefined) {
        let leaf = branch.get(b)
        if (leaf !== undefined) {
          leaf.delete(c)
          if (!leaf.size) {
            branch.delete(b)
          }
        }
        if (!branch.size) {
          root.delete(a)
        }
      }
    },
    has: function (a, b, c) {
      let branch = root.get(a)
      let leaf = branch === undefined ? undefined : branch.get(b)
      return leaf === undefined ? False : leaf.has(c)
    },
    roots: function () {
      return map_iter(roots.keys(), identity)
    },
    branches: function (a) {
      branch = root.get(a)
      if (branch === undefined) return []
      return map_iter(branch.keys(), identity)
    },
    leaves: function (a, b) {
      branch = root.get(a)
      if (branch === undefined) return []
      leaf = branch.get(b)
      if (leaf === undefined) return []
      return map_iter(leaf.keys(), identity)
    }
  }
}


module.exports = function () {
  const graphling = {
    id: Symbol("graphling-id"),
    spo: store(),
    sop: store(),
    pso: store(),
    pos: store(),
    osp: store(),
    ops: store(),
    properties: new Map()
  }

  function index(val) {
    if (typeof val === "object") {
      val[graphling.id] = val[graphling.id] || Symbol()
      graphling.properties.set(val[graphling.id], val)
      return val[graphling.id]
    }
    return val
  }

  function props(key) {
    prop = graphling.properties.get(key)
    if (prop === undefined) return key
    return prop
  }

  function valid(val) {
    return val !== null && val !== undefined
  }

  return {
    link: function (subject, predicate, object) {
      if (!(valid(subject) && valid(predicate) && valid(object))) return false
      sub = index(subject)
      pred = index(predicate)
      ob = index(object)

      graphling.spo.add(sub, pred, ob)
      graphling.sop.add(sub, ob, pred)
      graphling.pso.add(pred, sub, ob)
      graphling.pos.add(pred, ob, sub)
      graphling.osp.add(ob, sub, pred)
      graphling.ops.add(ob, pred, sub)

      return true
    },
    unlink: function(subject, predicate, object) {
      sub = index(subject)
      pred = index(predicate)
      ob = index(object)

      graphling.spo.delete(sub, pred, ob)
      graphling.sop.delete(sub, ob, pred)
      graphling.pso.delete(pred, sub, ob)
      graphling.pos.delete(pred, ob, sub)
      graphling.osp.delete(ob, sub, pred)
      graphling.ops.delete(ob, pred, sub)
    },
    neighbors: function (node, {link = null, incoming = true, outgoing = true} = {}) {
      if (!valid(node)) return []

      const nid = index(node)
      const pid = valid(link) ? index(link) : null
      const nodes = new Set()
      if (outgoing && pid) {
        graphling.spo.leaves(nid, pid).forEach(o => nodes.add(o))
      } else if (outgoing) {
        graphling.sop.branches(nid).forEach(o => nodes.add(o))
      }
      if (incoming && pid) {
        graphling.ops.leaves(nid, pid).forEach(s => nodes.add(s))
      } else if (incoming) {
        graphling.osp.branches(nid).forEach(s => nodes.add(s))
      }
      return [...nodes].map(n => props(n))
    },
    relationships: function (node, {other = null, incoming = true, outgoing = true} = {}) {
      if (!valid(node)) return []

      const nid = index(node)
      const oid = valid(other) ? index(other) : null
      const preds = new Set()
      if (outgoing && oid) {
        graphling.sop.leaves(nid, oid).forEach(p => preds.add(p))
      } else if (outgoing) {
        graphling.spo.branches(nid).forEach(p => preds.add(p))
      }
      if (incoming && oid) {
        graphling.osp.leaves(nid, oid).forEach(p => preds.add(p))
      } else if (incoming) {
        graphling.ops.branches(nid).forEach(p => preds.add(p))
      }
      return [...preds].map(p => props(p))
    },
    nodes: function (link, {origins = true, targets = true} = {}) {
      if (!valid(link)) return []

      const lid = index(link)
      const all = new Set()

      if (origins) {
        graphling.pso.branches(lid).forEach(s => all.add(s))
      }
      if (targets) {
        graphling.pos.branches(lid).forEach(s => all.add(s))
      }

      return [...all].map(a => props(a))
    }
  }
}
