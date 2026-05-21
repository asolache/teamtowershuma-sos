// =============================================================================
// SOS V11 · DRY-RUN PRE-DEMO · simula el recorregut canvas+pitch+VNA amb shim
// DOM mínim a Node. Detecta blockers d'init/render abans del test amb usuari.
// =============================================================================

import http from 'node:http';

// ─── Shim global · DOM/storage/fetch mínim per a vistes SOS ──────────────
class FakeStorage {
    constructor() { this._d = {}; }
    getItem(k)  { return Object.hasOwn(this._d, k) ? this._d[k] : null; }
    setItem(k, v) { this._d[k] = String(v); }
    removeItem(k) { delete this._d[k]; }
    clear() { this._d = {}; }
    get length() { return Object.keys(this._d).length; }
    key(i) { return Object.keys(this._d)[i] || null; }
}

const _evtMap = new Map();
function _node(tag) {
    return {
        tagName: tag.toUpperCase(),
        innerHTML: '', outerHTML: '', textContent: '', value: '',
        children: [], style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        setAttribute() {}, removeAttribute() {}, getAttribute: () => null,
        addEventListener() {}, removeEventListener() {},
        appendChild(c) { this.children.push(c); return c; },
        removeChild() {}, insertBefore() {}, contains: () => false,
        querySelector: () => null, querySelectorAll: () => [],
        closest: () => null, focus() {}, blur() {}, click() {},
        getBoundingClientRect: () => ({ x:0, y:0, width:0, height:0, top:0, left:0, right:0, bottom:0 }),
    };
}

globalThis.window = globalThis;
globalThis.document = {
    title: '',
    body: _node('body'),
    documentElement: _node('html'),
    head: _node('head'),
    createElement: _node,
    createElementNS: (_, t) => _node(t),
    createTextNode: (t) => ({ textContent: t }),
    createDocumentFragment: () => _node('df'),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (e, f) => { _evtMap.set(e, f); },
    removeEventListener: () => {},
    dispatchEvent: () => true,
    cookie: '',
    readyState: 'complete',
};
globalThis.location = { href: 'http://localhost:8765/', pathname: '/', search: '', hash: '', origin: 'http://localhost:8765' };
globalThis.history = { pushState() {}, replaceState() {}, back() {}, forward() {} };
globalThis.localStorage    = new FakeStorage();
globalThis.sessionStorage  = new FakeStorage();
try { Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node-dry-run', language: 'ca' }, configurable: true }); } catch (_) {}
globalThis.HTMLElement = function() {};
globalThis.requestAnimationFrame = (f) => setTimeout(f, 0);
globalThis.cancelAnimationFrame  = (id) => clearTimeout(id);
globalThis.MutationObserver = class { observe() {} disconnect() {} };
globalThis.ResizeObserver   = class { observe() {} disconnect() {} };
globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
globalThis.URL = URL;
globalThis.URLSearchParams = URLSearchParams;
globalThis.btoa = (s) => Buffer.from(s, 'utf8').toString('base64');
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('utf8');
if (!globalThis.crypto || !globalThis.crypto.randomUUID) {
    try { Object.defineProperty(globalThis, 'crypto', { value: { randomUUID: () => 'dryrun-' + Math.random().toString(36).slice(2, 10), getRandomValues: (a) => { for (let i=0; i<a.length; i++) a[i] = (Math.random()*256)|0; return a; } }, configurable: true }); } catch (_) {}
}

// fetch · proxy al servidor local 8765
const ORIGIN = 'http://localhost:8765';
globalThis.fetch = function(url, opts = {}) {
    return new Promise((resolve, reject) => {
        const u = String(url).startsWith('http') ? String(url) : ORIGIN + (String(url).startsWith('/') ? '' : '/') + String(url);
        const req = http.get(u, (res) => {
            let body = '';
            res.on('data', (c) => body += c);
            res.on('end', () => resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                statusText: res.statusMessage,
                headers: { get: (h) => res.headers[h.toLowerCase()] },
                text:  async () => body,
                json:  async () => JSON.parse(body),
                arrayBuffer: async () => new TextEncoder().encode(body).buffer,
            }));
        });
        req.on('error', reject);
        req.setTimeout(5000, () => req.destroy(new Error('timeout')));
    });
};

// ─── Dry-run · 7 punts del checklist ─────────────────────────────────────
let pass = 0, fail = 0;
const blockers = [];
function ok(label, cond, blocker = false) {
    if (cond) { pass++; console.log('✓', label); }
    else { fail++; console.log('✗', label); if (blocker) blockers.push(label); }
}

console.log('\n=== DRY-RUN PRE-DEMO · canvas + pitch + VNA ===\n');

// ─── 1 · Boot HTML 200 ────────────────────────────────────────────────
console.log('— 1 · Boot');
const bootRes = await fetch('/');
const bootHtml = await bootRes.text();
ok('1 · / retorna 200',                        bootRes.ok, true);
ok('1 · HTML conté el boot-shell',              bootHtml.includes('boot-title'), true);
ok('1 · script type=module · router.js',        bootHtml.includes('type="module"') && bootHtml.includes('router.js'), true);

// ─── 2 · Import + instanciació de cada vista crítica ──────────────────
console.log('\n— 2 · Imports + instanciació (sense API key)');
const views = [
    ['ProjectCreationV2View', '/create'],
    ['CreateLiveView',         '/create-live'],
    ['ProjectCanvasView',      '/canvas?project=test-dryrun'],
    ['ProjectPitchView',       '/pitch?project=test-dryrun'],
    ['ValueMapView',           '/map'],
    ['DashboardV2View',        '/'],
    ['MatriuCurriculumView',   '/matriu-curriculum'],
];
const instances = {};
for (const [name, path] of views) {
    globalThis.location.pathname = path.split('?')[0];
    globalThis.location.search   = path.includes('?') ? '?' + path.split('?')[1] : '';
    globalThis.location.href     = ORIGIN + path;
    try {
        const mod = await import('../views/' + name + '.js?cb=' + Date.now());
        const View = mod.default;
        const inst = new View();
        instances[name] = inst;
        ok('2 · ' + name + ' · construïble',     !!inst, true);
    } catch (e) {
        ok('2 · ' + name + ' · construïble',     false, true);
        console.log('    └─', e.message.split('\n')[0].slice(0, 100));
    }
}

// ─── 3 · getHtml() de cada vista (no llança · retorna string) ─────────
console.log('\n— 3 · getHtml() sense throw');
for (const [name, path] of views) {
    globalThis.location.pathname = path.split('?')[0];
    globalThis.location.search   = path.includes('?') ? '?' + path.split('?')[1] : '';
    globalThis.location.href     = ORIGIN + path;
    const inst = instances[name];
    if (!inst) { fail++; console.log('✗ 3 ·', name, '· skipped (no instance)'); continue; }
    try {
        const html = await inst.getHtml();
        const lenOk = typeof html === 'string' && html.length > 50;
        ok('3 · ' + name + ' · getHtml() retorna string > 50 chars',  lenOk, true);
    } catch (e) {
        ok('3 · ' + name + ' · getHtml() sense throw',                  false, true);
        console.log('    └─', e.message.split('\n')[0].slice(0, 120));
    }
}

// ─── 4 · Canvas sense ?project · ha de mostrar UX d'error neta ────────
console.log('\n— 4 · Edge case · canvas sense project');
globalThis.location.pathname = '/canvas';
globalThis.location.search   = '';
globalThis.location.href     = ORIGIN + '/canvas';
try {
    const mod = await import('../views/ProjectCanvasView.js?cb=' + Date.now());
    const inst = new (mod.default)();
    const html = await inst.getHtml();
    // UX amistosa · ha de tenir títol clar + link de tornada · NO ha de cridar error tècnic crud
    const friendly = /Cal indicar|sense projecte|cap projecte|404|crea un projecte|wizard/i.test(html);
    const hasLink  = /href="\/(dashboard|home|create|\?)"/i.test(html);
    const noCrash  = !/undefined|TypeError|Cannot read|stack trace/i.test(html);
    ok('4 · canvas sense project · missatge amistós',  friendly && noCrash, true);
    ok('4 · canvas sense project · té enllaç de tornada', hasLink, true);
} catch (e) {
    ok('4 · canvas sense project · no throw',           false, true);
}

// ─── 5 · Pitch amb project inexistent · UX neta ───────────────────────
console.log('\n— 5 · Edge case · pitch amb project inexistent');
globalThis.location.search = '?project=nonexistent-' + Date.now();
try {
    const mod = await import('../views/ProjectPitchView.js?cb=' + Date.now());
    const inst = new (mod.default)();
    const html = await inst.getHtml();
    const friendly = /no trobat|not found|sense|cap projecte|404|introvable|nonexistent|Cal indicar|wizard/i.test(html);
    const noCrash  = !/undefined|TypeError|Cannot read|stack trace/i.test(html);
    ok('5 · pitch projecte inexistent · missatge amistós',  friendly && noCrash, true);
} catch (e) {
    ok('5 · pitch projecte inexistent · no throw',          false, true);
}

// ─── 6 · ValueMap mode blanc · pot operar sense projecte preexistent ──
console.log('\n— 6 · /map sense projecte (mode blanc)');
globalThis.location.pathname = '/map';
globalThis.location.search   = '';
try {
    const mod = await import('../views/ValueMapView.js?cb=' + Date.now());
    const inst = new (mod.default)();
    const html = await inst.getHtml();
    ok('6 · /map sense project · render OK',  typeof html === 'string' && html.length > 100);
} catch (e) {
    ok('6 · /map sense project · render OK',  false, true);
    console.log('    └─', e.message.split('\n')[0].slice(0, 120));
}

// ─── 6.5 · Demo project · flow canvas/pitch/map amb id real ────────────
console.log('\n— 6.5 · Demo project · flow real (proj-colla-demo-v11)');
const DEMO_ID = 'proj-colla-demo-v11';
for (const [viewName, route] of [
    ['ProjectCanvasView', '/canvas?project=' + DEMO_ID],
    ['ProjectPitchView',  '/pitch?project='  + DEMO_ID],
    ['ValueMapView',      '/map?project='    + DEMO_ID],
]) {
    globalThis.location.pathname = route.split('?')[0];
    globalThis.location.search   = '?' + route.split('?')[1];
    globalThis.location.href     = ORIGIN + route;
    try {
        const mod = await import('../views/' + viewName + '.js?cb=' + Date.now());
        const inst = new (mod.default)();
        const html = await inst.getHtml();
        const noErr   = !/Cannot read|TypeError|undefined is not|projecte no trobat|not found/i.test(html);
        const hasMain = typeof html === 'string' && html.length > 200;
        ok('6.5 · ' + viewName + ' · render amb demo project', noErr && hasMain, true);
    } catch (e) {
        ok('6.5 · ' + viewName + ' · render amb demo project', false, true);
        console.log('    └─', e.message.split('\n')[0].slice(0, 120));
    }
}

// ─── 7 · KnowledgeLoader funcional · sectors + matriu carreguen ──────
console.log('\n— 7 · KnowledgeLoader carrega contingut');
try {
    const kl = await import('../core/KnowledgeLoader.js?cb=' + Date.now());
    const KL = kl.KnowledgeLoader;
    const k  = await KL.parseFile('sectors/K.md');
    ok('7 · sector K parsejat · té frontmatter',  k && k.frontmatter && Object.keys(k.frontmatter).length > 0);
    const d02 = await KL.getMatriuDomain('d02-value-mapping');
    ok('7 · matriu D-02 carregat',                 d02 && d02.frontmatter?.id === 'd02-value-mapping');
    const ctx = await KL.buildContext({ sector: 'K' });
    ok('7 · buildContext(sector=K) genera prompt', ctx && typeof ctx.systemPrompt === 'string' && ctx.systemPrompt.length > 200);
} catch (e) {
    ok('7 · KnowledgeLoader funcional',  false, true);
    console.log('    └─', e.message.split('\n')[0].slice(0, 120));
}

// ─── RESUM ────────────────────────────────────────────────────────────
console.log('\n=== RESUM ===');
console.log(pass + ' pass · ' + fail + ' fail');
if (blockers.length) {
    console.log('\nBLOCKERS · ' + blockers.length);
    blockers.forEach(b => console.log('  ⛔', b));
    process.exit(1);
}
console.log('\n✅ Cap blocker · GO per al test de demà');
process.exit(0);
