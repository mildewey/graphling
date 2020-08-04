function store() {
  const map = new Map()

  return {
    add: function (key, value) {
      values = map[key]
      if (values === undefined) {
        map[key] = values = new Set()
      }
      values.add(value)
    },
    delete: function (key, value) {
      const values = map[key]
      if (values !== undefined) {
        values.delete(value)
        if (!values.size) {
          map.delete(key)
        }
      }
    },
    has: function (key, value) {
      values = map[key]
      return values !== undefined && values.has(value)
    },
    values: function(key) {
      const values = map[key]
      if (values === undefined) {
        return []
      }
      return [...map[key]]
    }
  }
}


module.exports = function () {
  const graphling = {
    id: Symbol("graphling-id"),
    subject: {
      predicates: store(),
      objects: store()
    },
    predicate: {
      subjects: store(),
      objects: store()
    },
    object: {
      subjects: store(),
      predicates: store()
    },
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

      graphling.subject.predicates.add(sub, pred)
      graphling.subject.objects.add(sub, ob)
      graphling.predicate.subjects.add(pred, sub)
      graphling.predicate.objects.add(pred, ob)
      graphling.object.subjects.add(ob, sub)
      graphling.object.predicates.add(ob, pred)

      return true
    },
    unlink: function(subject, predicate, object) {
      sub = index(subject)
      pred = index(predicate)
      ob = index(object)

      graphling.subject.predicates.delete(sub, pred)
      graphling.subject.objects.delete(sub, ob)
      graphling.predicate.subjects.delete(pred, sub)
      graphling.predicate.objects.delete(pred, ob)
      graphling.object.subjects.delete(ob, sub)
      graphling.object.predicates.delete(ob, pred)
    },
    neighbors: function (node, {link = null, incoming = true, outgoing = true} = {}) {
      if (!valid(node)) return []

      const nid = index(node)
      const lid = valid(link) ? index(link) : null
      const nodes = new Set()
      if (outgoing) {
        const out = graphling.subject.objects.values(nid)
        if (lid !== null) {
          out.filter(o => graphling.predicate.objects.has(o, lid)).forEach(o => nodes.add(o))
        } else {
          out.forEach(o => nodes.add(o))
        }
      }
      if (incoming) {
        const inc = graphling.object.subjects.values(nid)
        if (lid !== null) {
          inc.filter(o => graphling.predicate.objects.has(o, lid)).forEach(o => nodes.add(o))
        } else {
          inc.forEach(o => nodes.add(o))
        }
      }
      return [...nodes].map(n => props(n))
    },
    relationships: function (node, {object = null, incoming = true, outgoing = true} = {}) {
      if (!valid(node)) return []

      const nid = index(node)
      const oid = valid(object) ? index(object) : null
      const preds = new Set()
      if (outgoing) {
        const out = graphling.subject.predicates.values(nid)
        if (oid !== null) {
          out.filter(o => graphling.object.predicates.has(o, oid)).forEach(o => preds.add(o))
        } else {
          out.forEach(o => preds.add(o))
        }
      }
      if (incoming) {
        const inc = graphling.object.predicates.values(nid)
        if (oid !== null) {
          inc.filter(o => graphling.object.predicates.has(o, oid)).forEach(o => preds.add(o))
        } else {
          inc.forEach(o => preds.add(o))
        }
      }
      return [...preds].map(p => props(p))
    },
    nodes: function (link, {origins = true, targets = true} = {}) {
      if (!valid(link)) return []

      const lid = index(link)
      const all = new Set()

      if (origins) {
        graphling.predicate.subjects.values(lid).forEach(s => all.add(s))
      }
      if (targets) {
        graphling.predicate.objects.values(lid).forEach(s => all.add(s))
      }

      return [...all].map(a => props(a))
    }
  }
}
