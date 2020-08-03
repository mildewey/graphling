function store() {
  const map = new Map()

  return {
    add: function (key, value) {
      if (!map.has(key)) {
        map[key] = new Set()
      }
      map[key].add(value)
    },
    delete: function (key, value) {
      if (map.has(key)) {
        map[key].delete(value)
        if (!map[key].size) {
          map.delete(key)
        }
      }
    },
    has: function (key, value) {
      return map.has(key) && map[key].has(value)
    },
    values: function(key) {
      if (!map.has(key)) {
        return []
      }
      return [...map[key]]
    }
  }
}


module.exports = function () => {
  const id = Symbol("graphling-id")
  const subject = {
    predicates: store(),
    objects: store()
  }
  const predicate = {
    subjects: store(),
    objects: store()
  }
  const object = {
    subjects: store(),
    predicates: store()
  }
  const properties = new Map()

  function index(val) {
    if (typeof val === "object") {
      val[id] = val[id] || Symbol()
      properties.set(val[id], val)
      return val[id]
    }
    return val
  }

  function props(key) {
    prop = properties.get(key)
    if (prop === undefined) return key
    return prop
  }

  function valid(val) {
    return val !== null && val !== undefined
  }

  return {
    link: function (subject, predicate, object) {
      if !(valid(subject) && valid(predicate) && valid(object)) return false
      sub = index(subject)
      pred = index(predicate)
      ob = index(object)

      subject.predicates.add(sub, pred)
      subject.objects.add(sub, pred)
      predicate.subjects.add(pred, sub)
      predicate.objects.add(pred, ob)
      object.subjects.add(ob, sub)
      object.predicates.add(ob, pred)

      return true
    },
    unlink: function(subject, predicate, object) {
      sub = index(subject)
      pred = index(predicate)
      ob = index(object)

      subject.predicates.delete(sub, pred)
      subject.objects.delete(sub, pred)
      predicate.subjects.delete(pred, sub)
      predicate.objects.delete(pred, ob)
      object.subjects.delete(ob, sub)
      object.predicates.delete(ob, pred)
    },
    neighbors: function (node, link=null, outgoing=true, incoming=true) {
      if (!valid(node)) return []

      const nid = index(node)
      const lid = valid(link) ? index(link) : null
      const nodes = []
      if (outgoing) {
        const out = subject.objects.values(nid)
        if (lid !== null) {
          nodes.push(...out.filter(o => predicate.objects.has(o, lid)))
        }
      }
      if (incoming) {
        const in = object.subjects.values(nid)
        if (lid !== null) {
          nodes.push(...in.filter(i => predicate.subjects.has(i, lid)))
        }
      }
      return nodes.map(n => props(n))
    },
    relationships: function (node, object=null, outgoing=true, incoming=true) {
      if (!valid(node)) return []

      const nid = index(node)
      const oid = valid(object) ? index(object) : null
      const preds = []
      if (outgoing) {
        const out = subject.predicates.values(nid)
        if (oid !== null) {
          preds.push(...out.filter(o => object.predicates.has(o, oid)))
        }
      }
      if (incoming) {
        const in = object.predicates.values(nid)
        if (oid !== null) {
          preds.push(...in.filter(i => subject.predicates.has(i, oid)))
        }
      }
      return preds.map(p => props(p))
    },
    nodes: function (link, origins=true, targets=true) {
      if (!valid(link)) return []

      const lid = index(link)
      const all = []

      if (origins) {
        all.push(...predicate.subjects.values(lid))
      }
      if (targets) {
        all.push(...predicate.objects.values(lid))
      }

      return all.map(a => props(a))
    }
  }
}
