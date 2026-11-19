// Deliberately broken core, loaded after gf-core by `node tests/selftest.mjs --self-test`.
// EXPECT_FAILING: ["checkout plan: Stardog request shapes", "cart: a relationship without its classes", "identity: a class keyed differently", "live: only rdf:type constants name a class", "connections: YAML profiles with defaults", "live: every stated domain is kept", "live: one mapping split over several TriplesMaps", "live: a schema that combines other schemas", "live: the most specific schema owns a term", "sms2: expression binds stay expressions", "project: a saved project never carries a password", "checkout run: an existing database keeps the reasoning schemas", "checkout run: a graph that holds data is not replaced", "history: deployment records read back", "trust: on request", "virtual graphs: none is missed", "checkout run: the record names only", "checkout: every source system gets its own", "rules: a rule’s own PREFIX lines", "schemas: the default reasoning schema", "mapping blocks: only the statements", "designer: a cart becomes a project", "layout: boxes never overlap", "data side: what each block reads", "fog: other sources for parts already filled"]
//
// Breakage 1 — virtual-graph body with "mappings.syntax" at the top level. Stardog's server
// reads it from inside "options", so a top-level key is silently ignored and the mappings are parsed with the wrong syntax.
// Breakage 2 — missing prerequisites dropped from the cart assembly. Symptom: a cart holding only
// "placed order" shows no warning, and checkout writes a model whose relationship points at
// classes that are not defined. No error anywhere; the guide just looks complete.
// Breakage 3 — identity compared by the IRI pattern's fixed prefix only ("account/" in both), so
// a class keyed by account_id in one source and bank_code + acct_id in another is not flagged; the
// two sources then mint different IRIs for the same account and joins silently return nothing.
// Breakage 4 — any constant object read as the mapping's class, whatever its predicate. Symptom: a
// mapping that sets segment = Gold is listed as "how to map a Gold", and a mapping that types nothing gets a class.
// Breakage 5 — connection-file comments stripped with a plain regex (" #" to end of line). Symptom: a quoted password containing " #" is cut short, so sign-in
// fails with 401 although the file is right; a # only starts a comment outside quotes.
// Breakage 6 — a live term exported from its parsed fields instead of the statements read: only the
// first domain/range kept, schema.org domainIncludes folded into rdfs:domain, a default xsd:string
// range written when none was stated, and statements the app does not model (tags, notes) dropped. Symptom: the exported Turtle says
// things the source model never said (a property gains a domain, or a range nobody chose).
// Breakage 7 — TriplesMaps read one by one, ignoring triplesMapParentId. Symptom:
// Stardog stores one SMS2 mapping as several TriplesMaps; the pieces without the rdf:type were
// dropped as "typed nothing", so a class showed fewer attributes mapped than its mapping fills.
// Breakage 8 — a schema over several graphs read as if it were one graph. Symptom:
// a schema that bundles many model graphs took the name of the first graph's ontology header.
// Breakage 9 — terms owned by whichever schema was read first. Symptom: every
// class was listed under the bundling schema instead of the schema of the one graph that defines it.
// Breakage 10 — a catalog expression read as a column name. Symptom: the SMS2
// export wrote BIND(xsd:string(?(CONCAT(...))) AS ?(CONCAT(...))_v), which Stardog rejects.
// Breakage 11 — a project file built by copying the connection objects. Symptom: the saved file looks
// right and reopens fine, and it carries the password or token of every server the user signed in to.
// Breakage 12 — the reasoning schema registered as the only one. Symptom: checkout into an existing
// database reports success, and every reasoning schema the database already had is gone (POST options
// replaces the whole list).
// Breakage 13 — the "graph already holds data" check that never stops. Symptom: checkout into an
// existing database silently replaces someone's model graph (the write starts with DROP GRAPH).
// Breakage 14 — merged catalogs keep only the first server's deployment history (mergeCatalog copies
// base.log and drops add.log). Symptom: reuse counts and "deployed in" lists
// quietly ignore every server after the first.
// Breakage 15 — (retired with description matching.)
// Breakage 16 — "no data" decided from the class's own mappings only. Symptom (seen in the page): Party,
// whose subclasses Person and Organization are mapped, was said to have nothing supplying it.
// Breakage 17 — a virtual graph trusted as soon as the catalog lists it. Symptom: a virtual graph the
// catalog has registered but not harvested mappings for contributes nothing, and nothing says so.
// Breakage 18 — the deployment record lists every planned virtual graph. Symptom: a
// source system missing on the server skips its virtual graph, yet the record says it was deployed.
// Breakage 19 — virtual graph names from the first word of the source name. Symptom: sources sales_crm and sales_erp both got "<db>_sales"; the second virtual graph failed with
// "already exists" and the orders had no data.
// Breakage 20 — a rule's own PREFIX lines ignored. Symptom: a rule written with
// PREFIX : <…> and :LargeOrder inferred nothing, and listed the namespace itself as a term it uses.
// Breakage 21 — only named reasoning schemas read. Symptom: a database whose
// model is the default schema (reasoning.schema.graphs) said "no reasoning schemas".
// Breakage 22 — a mapping block written whole whatever the cart holds. Symptom: checkout creates data
// for attributes nobody put in the model.
// Breakage 23 — Designer mappings over uploaded files dropped on import (what the first reader did).
// Symptom: a project built on CSV files opens with its model and no data.
// Breakage 24 — no spacing pass after the force layout. On a large catalog (classes with 30+
// attributes, dozens of neighbours) boxes then sit on top of each other and their text is unreadable;
// the sample catalog alone does not show it, so the test builds a crowded one.
(function () {
  var cp = GF.connectionProfiles;
  GF.connectionProfiles = function (text) { return cp(String(text).split(/\r?\n/).map(function (l) { return l.replace(/\s+#.*$/, ''); }).join('\n')); };
  var mft = GF.modelFromTriples;
  GF.modelFromTriples = function (info, rows, ns) {
    var r = mft(Object.assign({}, info, { graphs: info.graphs.slice(0, 1) }), rows, ns);
    r.model.graphs = info.graphs.slice();
    r.components.forEach(function (c) {
      delete c.triples;
      if (c.kind !== 'objectProperty' && c.kind !== 'datatypeProperty') return;
      c.domains = c.domain ? [c.domain] : []; c.ranges = c.range ? [c.range] : []; delete c.domainIncludes; delete c.rangeIncludes;
    });
    return r;
  };
  var bi10 = GF.buildIndex;
  GF.buildIndex = function (cat) { var ix = bi10(cat); ix.list.forEach(function (c) { (c.bind || []).forEach(function (b) { b.isExpr = false; }); }); return ix; };
  var lc = GF.liveCatalog;
  GF.liveCatalog = function (parts, rows) {
    if (parts.length === 2 && parts[0].model.id === 'd/ALL') {
      // only the ownership case: same graph counts, so read order decides
      var p2 = parts.map(function (p) { return { model: Object.assign({}, p.model, { graphs: ['urn:same'] }), components: p.components }; });
      var cat = lc(p2, rows); cat.models.forEach(function (m) { var o = parts.filter(function (p) { return p.model.id === m.id; })[0]; if (o) m.graphs = o.model.graphs; });
      return cat;
    }
    return lc(parts, rows);
  };
  var mfc = GF.mappingsFromCatalog;
  GF.mappingsFromCatalog = function (rows, defs, dbOf, labels) {
    var T = GF.STD_PREFIXES.rdf + 'type';
    return mfc(rows.map(function (r) { var x = r.ocon ? Object.assign({}, r, { pred: T }) : Object.assign({}, r); delete x.parent; return x; }), defs, dbOf, labels);
  };
  GF.identityReview = function (ix, classIri) {
    var rows = (ix.mappingsFor[classIri] || []).map(function (mi) { return ix.byIri[mi]; }).filter(function (m) { return m.subjectClass === classIri; })
      .map(function (m) { return { mapping: m.iri, template: m.subjectTemplate, keys: GF.templateKeys(m.subjectTemplate) }; });
    var pre = {}; rows.forEach(function (r) { pre[r.template.split('{')[0]] = 1; });
    return { rows: rows, divergent: Object.keys(pre).length > 1 };
  };
  var plan = GF.planCheckout;
  GF.planCheckout = function (ix, cart, target, ctx) {
    var p = plan(ix, cart, target, ctx);
    p.steps.forEach(function (s) {
      if (s.id.indexOf('vg-') === 0) { var b = JSON.parse(s.body); b['mappings.syntax'] = 'SMS2'; delete b.options; s.body = JSON.stringify(b); }
      if (s.id === 'schema') s.build = function () { return JSON.stringify({ 'reasoning.schemas': [target.schemaName + '=' + target.modelGraph] }); };
      if (s.id === 'check-graph') s.check = function () { return { note: 'checked' }; };
      if (s.id === 'record-vgs' || s.id === 'log-shared') { var full = p.vgs; s.skip = null; s.build = function () { return 'INSERT DATA { ' + full.map(function (v) { return v.name; }).join(' ') + ' }'; }; }
    });
    return p;
  };
  var mp = GF.makeProject;
  GF.makeProject = function (p) { var o = mp(p); o.connections = (p.connections || []).map(function (c) { return Object.assign({}, c); }); return o; };
  var vrd = GF.vgsToReadDirectly;
  GF.vgsToReadDirectly = function (all, scope, rows, dbs) {
    var r = vrd(all, scope, rows, dbs), listed = {};
    scope.forEach(function (x) { if (x.vg) listed[x.vg.replace(/^virtual:\/\//, '')] = true; });
    r.read = r.read.filter(function (x) { return !listed[x.vg]; });
    return r;
  };
  var tro = GF.trustOf;
  GF.trustOf = function (ix, iri) {
    var r = tro(ix, iri), c = ix.byIri[iri];
    if (c && c.kind === 'class' && !(ix.mappingsFor[iri] || []).length && !r.warnings.some(function (w) { return w.code === 'nodata'; })) r.warnings.push({ code: 'nodata' });
    return r;
  };
  var mc = GF.mergeCatalog;
  GF.mergeCatalog = function (base, add) { var o = mc(base, add); o.log = (base.log || []).slice(); return o; };
  var vgn = GF.vgNames;
  GF.vgNames = function (target, list) { var o = {}; list.forEach(function (ds) { o[ds] = GF.slug(target.database + '_' + GF.dsName(ds).split(/[_\W]/)[0]); }); return o; };
  GF.rulePrefixes = function (body, ns) { return Object.assign({}, ns || {}); };
  var psc = GF.parseSchemas;
  GF.parseSchemas = function (o) { return psc(o).filter(function (x) { return x.name !== 'default'; }); };
  var mpl = GF.mappingPlan;
  GF.mappingPlan = function (ix, cart, opts) {
    var r = mpl(ix, cart, opts);
    r.blocks.forEach(function (b) { var m = ix.byIri[b.iri]; b.keep = m.bind.map(function (x) { return x.prop; }); b.drop = []; r.keepOf[b.iri] = null; });
    return r;
  };
  var d2c = GF.designerToCatalog;
  GF.designerToCatalog = function (p) { var c = d2c(p); c.components = c.components.filter(function (x) { return x.via !== 'file'; }); return c; };
  var asm = GF.assembleCart;
  GF.assembleCart = function (ix, cart) { var a = asm(ix, cart); a.missing = []; return a; };
  GF.separateBoxes = function () { return 0; };
  // Breakage 25 — a relationship's template columns read as plain values, and a subclass's blocks
  // dropped: the mapping diagram then draws customer_id into an attribute row instead of the
  // relationship, and Party (mapped only through Person and Organization) shows nothing mapped.
  var bcol = GF.blockColumns;
  GF.blockColumns = function (m) { return bcol(m).map(function (c) { return c.role === 'link' ? Object.assign({}, c, { role: 'value' }) : c; }); };
  var bfor = GF.blocksFor;
  GF.blocksFor = function (ix, iri) { return bfor(ix, iri).filter(function (b) { return b.why !== 'sub'; }); };
  // Breakage 26 — other sources for already-filled parts suggested as if they filled a gap (no
  // also flag): the canvas then draws them as strongly as blocks the cart actually needs.
  var fg = GF.fogGraph;
  GF.fogGraph = function (ix, cart, opts) { var f = fg(ix, cart, opts); f.maps.forEach(function (m) { delete m.also; }); return f; };
})();
