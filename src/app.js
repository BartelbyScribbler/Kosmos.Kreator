(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const VIEW_W = 1200;
  const VIEW_H = 800;
  const CENTER = { x: VIEW_W / 2, y: VIEW_H / 2 };
  const ORBIT_SAMPLES = 220;
  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const normDeg = (d) => ((Number(d) % 360) + 360) % 360;
  const deg = (d) => Number(d) * Math.PI / 180;
  const round = (n, places = 2) => Number(Number(n).toFixed(places));
  const uid = (prefix) => crypto.randomUUID ? crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const state = {
    atlas: null,
    sceneId: '',
    selection: { kind: null, id: null },
    draggingId: null,
    simDays: 0,
    playing: false,
    speed: 1,
    lastFrame: 0,
  };

  function makeInteraction(type = 'popup', target = '') {
    return { type, target };
  }

  function createScene(overrides = {}) {
    return {
      id: uid('scene'),
      name: 'New Scene',
      subtitle: 'Celestial neighborhood',
      parentSceneId: '',
      mapUnits: 'units',
      viewRadius: 500,
      center: {
        id: 'center',
        name: 'Primary',
        image: '',
        size: 62,
        loreId: '',
        aliases: [],
        motion: { rotationPeriodHours: 0, rotationPhase: 0, rotationDirection: 1, spinSymbol: false },
      },
      shell: { radius: 450, travelDays: 0, label: 'Crystal Shell', show: false, showPortals: true },
      groups: [],
      bodies: [],
      regions: [],
      pois: [],
      portals: [],
      ...overrides,
      center: {
        id: 'center', name: 'Primary', image: '', size: 62, loreId: '', aliases: [],
        motion: { rotationPeriodHours: 0, rotationPhase: 0, rotationDirection: 1, spinSymbol: false },
        ...(overrides.center || {}),
        motion: {
          rotationPeriodHours: 0, rotationPhase: 0, rotationDirection: 1, spinSymbol: false,
          ...(overrides.center?.motion || {}),
        },
      },
      shell: { radius: 450, travelDays: 0, label: 'Crystal Shell', show: false, showPortals: true, ...(overrides.shell || {}) },
      groups: Array.isArray(overrides.groups) ? overrides.groups : [],
      bodies: Array.isArray(overrides.bodies) ? overrides.bodies : [],
      regions: Array.isArray(overrides.regions) ? overrides.regions : [],
      pois: Array.isArray(overrides.pois) ? overrides.pois : [],
      portals: Array.isArray(overrides.portals) ? overrides.portals : [],
    };
  }

  function createBody(overrides = {}) {
    return {
      id: uid('body'),
      name: 'New World',
      aliases: [],
      image: '',
      size: 42,
      labelOffset: 34,
      groupId: '',
      parentId: '',
      loreId: '',
      orbit: { radius: 200, phase: 0, eccentricity: 0, rotation: 0, inclination: 0, node: 0, offsetX: 0, offsetY: 0 },
      motion: { orbitPeriodDays: 0, orbitDirection: 1, rotationPeriodHours: 0, rotationPhase: 0, rotationDirection: 1, spinSymbol: false },
      interaction: makeInteraction('popup', ''),
      showOrbit: true,
      showLabel: true,
      ...overrides,
      aliases: Array.isArray(overrides.aliases) ? overrides.aliases : [],
      orbit: { radius: 200, phase: 0, eccentricity: 0, rotation: 0, inclination: 0, node: 0, offsetX: 0, offsetY: 0, ...(overrides.orbit || {}) },
      motion: { orbitPeriodDays: 0, orbitDirection: 1, rotationPeriodHours: 0, rotationPhase: 0, rotationDirection: 1, spinSymbol: false, ...(overrides.motion || {}) },
      interaction: { ...makeInteraction('popup', ''), ...(overrides.interaction || {}) },
    };
  }

  function createGroup(overrides = {}) {
    return {
      id: uid('group'), name: 'New Group', collapsed: false, interactive: true,
      anchor: { radius: 0, theta: 0, inclination: 0 }, size: 62, loreId: '',
      interaction: makeInteraction('expand', ''),
      ...overrides,
      anchor: { radius: 0, theta: 0, inclination: 0, ...(overrides.anchor || {}) },
      interaction: { ...makeInteraction('expand', ''), ...(overrides.interaction || {}) },
    };
  }

  function createPortal(overrides = {}) {
    return {
      id: uid('portal'), name: 'New Portal', type: 'phlogiston', theta: 0, inclination: 0,
      size: 24, labelOffset: 28, showLabel: true, loreId: '', interaction: makeInteraction('popup', ''),
      ...overrides,
      interaction: { ...makeInteraction('popup', ''), ...(overrides.interaction || {}) },
    };
  }

  function createRegion(overrides = {}) {
    return {
      id: uid('region'), name: 'New Region', kind: 'cluster', radius: 220, phase: 0, span: 50,
      inclination: 0, node: 0, sharedWith: '', loreId: '', interaction: makeInteraction('popup', ''),
      showLabel: true,
      ...overrides,
      interaction: { ...makeInteraction('popup', ''), ...(overrides.interaction || {}) },
    };
  }

  function createPoi(overrides = {}) {
    return {
      id: uid('poi'), name: 'New Point', symbol: '◆', radius: 180, theta: 0, inclination: 0,
      sharedWith: '', phaseOffset: 0, size: 13, loreId: '', showLabel: true,
      interaction: makeInteraction('popup', ''),
      ...overrides,
      interaction: { ...makeInteraction('popup', ''), ...(overrides.interaction || {}) },
    };
  }

  function createBlankAtlas() {
    const root = createScene({ id: 'root', name: 'Untitled Kosmos', subtitle: 'Crystal Sphere Interior', center: { name: 'Sun' } });
    return {
      schema: 'kosmos-kreator/v0.3',
      name: 'Untitled Kosmos Atlas',
      rootSceneId: root.id,
      scenes: [root],
      lore: {},
      exportProfile: { htmlStartPlaying: false },
    };
  }

  function realmspaceAtlas() {
    const inner = createGroup({
      id: 'inner-realmspace', name: 'Inner Worlds', collapsed: true, interactive: true,
      anchor: { radius: 110, theta: 315, inclination: 0 }, size: 68, loreId: 'inner-realmspace',
      interaction: makeInteraction('expand', ''),
    });

    const realmspace = createScene({
      id: 'realmspace', name: 'Realmspace', subtitle: 'Crystal Sphere Interior · Wildspace Kosmos',
      mapUnits: 'million miles', viewRadius: 3400,
      center: { id: 'sol', name: 'Sol', size: 64, loreId: 'sol' },
      shell: { radius: 3200, travelDays: 32, label: 'Crystal Shell · 32 days from Sol', show: true, showPortals: true },
      groups: [inner],
      portals: [
        createPortal({ id: 'mercane-gate', name: 'Mercane Gate', theta: 40, inclination: 28, loreId: 'mercane-gate', interaction: makeInteraction('popup', '') }),
        createPortal({ id: 'deep-gate', name: 'Deep Gate', theta: 218, inclination: -37, loreId: 'deep-gate', interaction: makeInteraction('popup', '') }),
      ],
      bodies: [
        createBody({ id: 'anadia', name: 'Anadia', size: 24, groupId: 'inner-realmspace', loreId: 'anadia', orbit: { radius: 50, phase: 10 }, motion: { orbitPeriodDays: 0 } }),
        createBody({ id: 'coliar', name: 'Coliar', size: 29, groupId: 'inner-realmspace', loreId: 'coliar', orbit: { radius: 100, phase: 150, inclination: 3, node: 35 }, motion: { orbitPeriodDays: 0 } }),
        createBody({ id: 'toril', name: 'Toril', size: 35, groupId: 'inner-realmspace', loreId: 'toril', orbit: { radius: 200, phase: 265 }, interaction: makeInteraction('scene', 'toril-neighborhood') }),
        createBody({ id: 'karpri', name: 'Karpri', size: 34, groupId: 'inner-realmspace', loreId: 'karpri', orbit: { radius: 300, phase: 330, eccentricity: .08, rotation: 20, inclination: 9, node: 70 } }),
        createBody({ id: 'chandos', name: 'Chandos', size: 41, groupId: 'inner-realmspace', loreId: 'chandos', orbit: { radius: 400, phase: 195, eccentricity: .05, rotation: -12, inclination: 15, node: 110 } }),
        createBody({ id: 'glyth', name: 'Glyth', size: 42, loreId: 'glyth', orbit: { radius: 1000, phase: 315, eccentricity: .1, rotation: 12, inclination: 7, node: 20 } }),
        createBody({ id: 'garden', name: 'Garden', size: 42, loreId: 'garden', orbit: { radius: 1200, phase: 265, eccentricity: .03, rotation: 50, inclination: -6, node: 150 }, interaction: makeInteraction('scene', 'garden-neighborhood') }),
        createBody({ id: 'hcatha', name: "H'catha", size: 38, loreId: 'hcatha', orbit: { radius: 1600, phase: 95, eccentricity: .14, rotation: -15, inclination: 18, node: 40 } }),
      ],
    });

    const toril = createScene({
      id: 'toril-neighborhood', name: 'Toril Neighborhood', subtitle: 'Toril · Selûne · Tears of Selûne', parentSceneId: 'realmspace',
      mapUnits: 'local orbital units', viewRadius: 430,
      center: { id: 'toril-center', name: 'Toril', size: 88, loreId: 'toril', aliases: [], motion: { rotationPeriodHours: 24, rotationPhase: 0, rotationDirection: 1, spinSymbol: true } },
      bodies: [
        createBody({ id: 'selune', name: 'Selûne', aliases: ['Leira'], size: 43, loreId: 'selune', orbit: { radius: 220, phase: 70, eccentricity: .02, inclination: 5, node: 12 }, motion: { orbitPeriodDays: 30, orbitDirection: 1, rotationPeriodHours: 720, spinSymbol: true }, interaction: makeInteraction('scene', 'selune-local') }),
      ],
      regions: [
        createRegion({ id: 'tears-of-selune', name: 'Tears of Selûne', kind: 'asteroid-cluster', sharedWith: 'selune', phase: 34, span: 54, loreId: 'tears-of-selune', interaction: makeInteraction('scene', 'tears-local') }),
      ],
      pois: [
        createPoi({ id: 'rock-of-bral', name: 'Rock of Bral', symbol: '⬟', sharedWith: 'selune', phaseOffset: 46, loreId: 'rock-of-bral', interaction: makeInteraction('scene', 'rock-of-bral') }),
        createPoi({ id: 'lucent-edict', name: 'Wreck of the Lucent Edict', symbol: '✦', radius: 285, theta: 146, inclination: -7, loreId: 'lucent-edict', interaction: makeInteraction('popup', '') }),
        createPoi({ id: 'aperusa-anchorage', name: 'Aperusa Anchorage', symbol: '⚓', radius: 330, theta: 225, inclination: 12, loreId: 'aperusa-anchorage', interaction: makeInteraction('popup', '') }),
      ],
    });

    const tears = createScene({
      id: 'tears-local', name: 'Tears of Selûne', subtitle: 'Asteroid cluster trailing Selûne', parentSceneId: 'toril-neighborhood',
      mapUnits: 'cluster units', viewRadius: 450,
      center: { id: 'tears-center', name: 'The Tears', size: 1, loreId: 'tears-of-selune' },
      regions: [createRegion({ id: 'tears-field', name: 'The Tears', radius: 250, phase: 0, span: 300, loreId: 'tears-of-selune', interaction: makeInteraction('popup', '') })],
      pois: [
        createPoi({ id: 'bral-in-tears', name: 'Rock of Bral', symbol: '⬟', radius: 120, theta: 70, loreId: 'rock-of-bral', interaction: makeInteraction('scene', 'rock-of-bral') }),
        createPoi({ id: 'lucent-in-tears', name: 'Wreck of the Lucent Edict', symbol: '✦', radius: 210, theta: 195, inclination: -4, loreId: 'lucent-edict', interaction: makeInteraction('popup', '') }),
        createPoi({ id: 'aperusa-in-tears', name: 'Aperusa Anchorage', symbol: '⚓', radius: 280, theta: 300, inclination: 8, loreId: 'aperusa-anchorage', interaction: makeInteraction('popup', '') }),
      ],
    });

    const bral = createScene({
      id: 'rock-of-bral', name: 'Rock of Bral', subtitle: 'City on an asteroid · local scene placeholder', parentSceneId: 'toril-neighborhood',
      mapUnits: 'local', viewRadius: 150,
      center: { id: 'bral-center', name: 'Rock of Bral', size: 78, loreId: 'rock-of-bral' },
      pois: [
        createPoi({ id: 'bral-high-city', name: 'High City', symbol: '◆', radius: 62, theta: 15, loreId: 'bral-high-city', interaction: makeInteraction('popup', '') }),
        createPoi({ id: 'bral-mid-city', name: 'Middle City', symbol: '◆', radius: 66, theta: 128, loreId: 'bral-mid-city', interaction: makeInteraction('popup', '') }),
        createPoi({ id: 'bral-low-city', name: 'Lower City', symbol: '◆', radius: 72, theta: 245, loreId: 'bral-low-city', interaction: makeInteraction('popup', '') }),
      ],
    });

    const seluneScene = createScene({
      id: 'selune-local', name: 'Selûne', subtitle: 'Locally called Leira · local scene placeholder', parentSceneId: 'toril-neighborhood',
      mapUnits: 'local', viewRadius: 140,
      center: { id: 'selune-center', name: 'Selûne', aliases: ['Leira'], size: 74, loreId: 'selune' },
    });

    const gardenMoons = ['Grandchild','Yerthad','Peaceon','Retinae','Glorianus','Fjord','Locci','Dragon Rock','Knurl','Sunson','Templar','Farworld'];
    const gardenBodies = gardenMoons.map((name, i) => createBody({
      id: `garden-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
      name,
      size: 20 + (i % 4) * 3,
      loreId: `garden-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
      orbit: { radius: 95 + i * 18, phase: (i * 47) % 360, eccentricity: (i % 3) * .02, inclination: (i % 5 - 2) * 4, node: (i * 31) % 360 },
      motion: { orbitPeriodDays: 0, rotationPeriodHours: 0 },
      interaction: makeInteraction('popup', ''),
    }));
    const garden = createScene({
      id: 'garden-neighborhood', name: 'Garden & Twelve Moons', subtitle: 'Dense local satellite system', parentSceneId: 'realmspace',
      mapUnits: 'local orbital units', viewRadius: 360,
      center: { id: 'garden-center', name: 'Garden', size: 82, loreId: 'garden', motion: { rotationPeriodHours: 128, rotationPhase: 0, rotationDirection: 1, spinSymbol: true } },
      bodies: gardenBodies,
    });

    return {
      schema: 'kosmos-kreator/v0.3',
      name: 'Realmspace Atlas', rootSceneId: 'realmspace',
      scenes: [realmspace, toril, tears, bral, seluneScene, garden],
      lore: {
        sol: { name: 'Sol', summary: 'The primary of Realmspace.' },
        'inner-realmspace': { name: 'Inner Worlds', summary: 'A cartographic group that collapses the close-packed inner planets without changing their underlying orbital data.' },
        toril: { name: 'Toril', summary: 'Primary inhabited world of the Toril neighborhood. Double-click or use the inspector to enter its local celestial scene.' },
        selune: { name: 'Selûne', aliases: ['Leira'], summary: 'Toril’s moon. “Leira” is retained as an alias for local usage.' },
        'tears-of-selune': { name: 'Tears of Selûne', summary: 'The asteroid cluster that shares Toril’s local orbital neighborhood with Selûne. Entering the Tears is optional; major destinations can be reached directly.' },
        'rock-of-bral': { name: 'Rock of Bral', summary: 'A major spelljamming city on an asteroid within the Tears of Selûne. It is a direct scene destination from the Toril neighborhood.' },
        'lucent-edict': { name: 'Wreck of the Lucent Edict', summary: 'A minor point of interest represented by a lore popup rather than its own scene.' },
        'aperusa-anchorage': { name: 'Aperusa Anchorage', summary: 'A small anchorage. Popup-scale until it earns a larger map.' },
        garden: { name: 'Garden', summary: 'A clustered liveworld with twelve moons. This scene stress-tests dense satellite systems.' },
        'mercane-gate': { name: 'Mercane Gate', summary: 'A shell portal above the normal orbital plane.' },
        'deep-gate': { name: 'Deep Gate', summary: 'A lower-hemisphere shell portal. Its dashed rendering distinguishes the far hemisphere in the top-down projection.' },
        'bral-high-city': { name: 'High City', summary: 'Placeholder district marker for a future Rock of Bral map.' },
        'bral-mid-city': { name: 'Middle City', summary: 'Placeholder district marker for a future Rock of Bral map.' },
        'bral-low-city': { name: 'Lower City', summary: 'Placeholder district marker for a future Rock of Bral map.' },
      },
      exportProfile: { htmlStartPlaying: false },
    };
  }

  function currentScene() {
    return state.atlas.scenes.find((s) => s.id === state.sceneId) || state.atlas.scenes[0];
  }

  function collectionFor(kind, scene = currentScene()) {
    if (kind === 'body') return scene.bodies;
    if (kind === 'group') return scene.groups;
    if (kind === 'portal') return scene.portals;
    if (kind === 'region') return scene.regions;
    if (kind === 'poi') return scene.pois;
    return [];
  }

  function selected(kind) {
    if (state.selection.kind !== kind) return null;
    return collectionFor(kind).find((x) => x.id === state.selection.id) || null;
  }

  function setSelection(kind, id) {
    state.selection = { kind, id };
    renderObjectLists(); renderInspector(); renderMap();
  }

  function clearSelection() {
    state.selection = { kind: null, id: null };
    renderObjectLists(); renderInspector(); renderMap();
  }

  function setStatus(message) { $('statusText').textContent = message; }

  function mapScale(scene = currentScene()) {
    return Math.min(VIEW_W, VIEW_H) * .43 / Math.max(1, Number(scene.viewRadius) || 1);
  }

  function phaseAtTime(body, simDays = state.simDays) {
    const period = Number(body.motion?.orbitPeriodDays) || 0;
    if (!period) return normDeg(body.orbit.phase || 0);
    const dir = Number(body.motion?.orbitDirection) < 0 ? -1 : 1;
    return normDeg((Number(body.orbit.phase) || 0) + dir * 360 * simDays / period);
  }

  function rotationAtTime(obj, simDays = state.simDays) {
    const motion = obj.motion || {};
    const hours = Number(motion.rotationPeriodHours) || 0;
    if (!hours) return normDeg(motion.rotationPhase || 0);
    const dir = Number(motion.rotationDirection) < 0 ? -1 : 1;
    return normDeg((Number(motion.rotationPhase) || 0) + dir * 360 * (simDays * 24) / Math.abs(hours));
  }

  function setBodyDisplayedPhase(body, displayPhase) {
    const period = Number(body.motion?.orbitPeriodDays) || 0;
    const dir = Number(body.motion?.orbitDirection) < 0 ? -1 : 1;
    const elapsed = period ? dir * 360 * state.simDays / period : 0;
    body.orbit.phase = normDeg(displayPhase - elapsed);
  }

  function orbitModelPoint(orbit, phaseDeg) {
    const a = Math.max(.0001, Number(orbit.radius) || .0001);
    const e = clamp(Number(orbit.eccentricity) || 0, 0, .94);
    const b = a * Math.sqrt(1 - e * e);
    const E = deg(normDeg(phaseDeg) - 90);
    let x = a * (Math.cos(E) - e);
    let y = b * Math.sin(E);
    let z = 0;
    const arg = deg(Number(orbit.rotation) || 0);
    [x, y] = [x * Math.cos(arg) - y * Math.sin(arg), x * Math.sin(arg) + y * Math.cos(arg)];
    const inc = deg(clamp(Number(orbit.inclination) || 0, -89, 89));
    [y, z] = [y * Math.cos(inc), y * Math.sin(inc)];
    const node = deg(Number(orbit.node) || 0);
    [x, y] = [x * Math.cos(node) - y * Math.sin(node), x * Math.sin(node) + y * Math.cos(node)];
    x += Number(orbit.offsetX) || 0;
    y += Number(orbit.offsetY) || 0;
    return { x, y, z };
  }

  function orbitPoint(orbit, phaseDeg, scene = currentScene()) {
    const p = orbitModelPoint(orbit, phaseDeg);
    const s = mapScale(scene);
    return { x: CENTER.x + p.x * s, y: CENTER.y + p.y * s, z: p.z, modelX: p.x, modelY: p.y };
  }

  function polarPoint(radius, thetaDeg, inclinationDeg = 0, scene = currentScene()) {
    const theta = deg(normDeg(thetaDeg));
    const inc = deg(clamp(Number(inclinationDeg) || 0, -90, 90));
    const r = Number(radius) || 0;
    const planar = r * Math.cos(inc);
    const x = planar * Math.sin(theta);
    const y = -planar * Math.cos(theta);
    const z = r * Math.sin(inc);
    const s = mapScale(scene);
    return { x: CENTER.x + x * s, y: CENTER.y + y * s, z, modelX: x, modelY: y };
  }

  function orbitPathData(orbit, scene = currentScene()) {
    let d = '';
    for (let i = 0; i <= ORBIT_SAMPLES; i += 1) {
      const p = orbitPoint(orbit, i / ORBIT_SAMPLES * 360, scene);
      d += `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    }
    return `${d}Z`;
  }

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) el.setAttribute(k, String(v));
    return el;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function groupForBody(body, scene = currentScene()) { return scene.groups.find((g) => g.id === body.groupId) || null; }
  function bodyHiddenByGroup(body, scene = currentScene()) { return Boolean(groupForBody(body, scene)?.collapsed); }
  function groupMemberCount(group, scene = currentScene()) { return scene.bodies.filter((b) => b.groupId === group.id).length; }

  function sharedBody(id, scene = currentScene()) { return scene.bodies.find((b) => b.id === id) || null; }

  function regionOrbit(region, scene = currentScene()) {
    const shared = sharedBody(region.sharedWith, scene);
    if (shared) return { ...shared.orbit };
    return { radius: region.radius, phase: region.phase, eccentricity: 0, rotation: 0, inclination: region.inclination, node: region.node || 0, offsetX: 0, offsetY: 0 };
  }

  function regionPhase(region, scene = currentScene()) {
    const shared = sharedBody(region.sharedWith, scene);
    return shared ? phaseAtTime(shared) + Number(region.phase || 0) : Number(region.phase || 0);
  }

  function regionPathData(region, scene = currentScene()) {
    const orbit = regionOrbit(region, scene);
    const mid = regionPhase(region, scene);
    const span = clamp(Number(region.span) || 45, 1, 360);
    const samples = Math.max(8, Math.ceil(span / 4));
    let d = '';
    for (let i = 0; i <= samples; i += 1) {
      const phase = mid - span / 2 + span * (i / samples);
      const p = orbitPoint(orbit, phase, scene);
      d += `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    }
    return d;
  }

  function poiPoint(poi, scene = currentScene()) {
    const shared = sharedBody(poi.sharedWith, scene);
    if (shared) return orbitPoint(shared.orbit, phaseAtTime(shared) + Number(poi.phaseOffset || 0), scene);
    return polarPoint(poi.radius, poi.theta, poi.inclination, scene);
  }

  function objectRow(item, kind, icon, meta, image = '') {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `object-row${state.selection.kind === kind && state.selection.id === item.id ? ' selected' : ''}`;
    const iw = document.createElement('span'); iw.className = 'object-icon';
    if (image) { const img = document.createElement('img'); img.src = image; img.alt = ''; iw.appendChild(img); } else iw.textContent = icon;
    const name = document.createElement('span'); name.textContent = item.name;
    const detail = document.createElement('span'); detail.className = 'object-meta'; detail.textContent = meta;
    row.append(iw, name, detail);
    row.addEventListener('click', () => setSelection(kind, item.id));
    row.addEventListener('dblclick', () => followInteraction(item));
    return row;
  }

  function emptyNote(text) { const p = document.createElement('p'); p.className = 'field-note block'; p.textContent = text; return p; }

  function renderObjectLists() {
    const scene = currentScene();
    const specs = [
      ['groupList', scene.groups, 'group', (x) => x.collapsed ? '⊕' : '⊖', (x) => `${groupMemberCount(x, scene)} · ${x.collapsed ? 'folded' : 'open'}`],
      ['bodyList', scene.bodies, 'body', () => '●', (x) => `${round(x.orbit.radius,1)}`],
      ['regionList', scene.regions, 'region', () => '≈', (x) => `${round(x.span,0)}° arc`],
      ['poiList', scene.pois, 'poi', (x) => x.symbol || '◆', (x) => x.interaction?.type === 'scene' ? 'scene' : 'popup'],
      ['portalList', scene.portals, 'portal', () => '◇', (x) => `${round(normDeg(x.theta),0)}° / ${round(x.inclination,0)}°`],
    ];
    for (const [id, items, kind, iconFn, metaFn] of specs) {
      const list = $(id); clear(list);
      if (!items.length) list.appendChild(emptyNote(`No ${kind}s yet.`));
      else items.forEach((item) => list.appendChild(objectRow(item, kind, iconFn(item), metaFn(item), kind === 'body' ? item.image : '')));
    }
  }

  function populateSceneSelect(selectId, value = '', includeNone = true) {
    const select = $(selectId); clear(select);
    if (includeNone) { const o = document.createElement('option'); o.value = ''; o.textContent = '— none —'; select.appendChild(o); }
    state.atlas.scenes.forEach((scene) => { const o = document.createElement('option'); o.value = scene.id; o.textContent = scene.name; select.appendChild(o); });
    select.value = value || '';
  }

  function populateGroupSelect(value = '') {
    const select = $('bodyGroupSelect'); clear(select);
    const none = document.createElement('option'); none.value = ''; none.textContent = '— none —'; select.appendChild(none);
    currentScene().groups.forEach((g) => { const o = document.createElement('option'); o.value = g.id; o.textContent = g.name; select.appendChild(o); });
    select.value = value || '';
  }

  function populateSharedBodySelect(selectId, value = '') {
    const select = $(selectId); clear(select);
    const none = document.createElement('option'); none.value = ''; none.textContent = '— independent —'; select.appendChild(none);
    currentScene().bodies.forEach((b) => { const o = document.createElement('option'); o.value = b.id; o.textContent = b.name; select.appendChild(o); });
    select.value = value || '';
  }

  function renderSystemFields() {
    const scene = currentScene();
    $('systemNameInput').value = state.atlas.name;
    populateSceneSelect('sceneSelect', scene.id, false);
    $('sceneNameInput').value = scene.name;
    $('sceneSubtitleInput').value = scene.subtitle || '';
    $('viewRadiusInput').value = scene.viewRadius;
    $('mapUnitsInput').value = scene.mapUnits || 'units';
    $('centerNameInput').value = scene.center.name || 'Primary';
    $('shellRadiusInput').value = scene.shell.radius || 0;
    $('shellTravelDaysInput').value = scene.shell.travelDays || 0;
    $('shellLabelInput').value = scene.shell.label || 'Crystal Shell';
    $('showShellInput').checked = Boolean(scene.shell.show);
    $('showPortalsInput').checked = Boolean(scene.shell.showPortals);
  }

  function setOpenSceneButton(id, item) {
    const btn = $(id);
    const target = item?.interaction?.type === 'scene' ? item.interaction.target : '';
    btn.hidden = !target || !state.atlas.scenes.some((s) => s.id === target);
    btn.onclick = btn.hidden ? null : () => navigateScene(target);
  }

  function renderInspector() {
    const kinds = ['body','group','region','poi','portal'];
    const active = kinds.find((k) => selected(k));
    $('emptyInspector').hidden = Boolean(active);
    kinds.forEach((k) => $(`${k}Inspector`).hidden = k !== active);
    const item = active ? selected(active) : null;
    $('selectionReadout').textContent = item ? `${item.name} · ${active}` : 'No object selected';
    if (!item) return;

    if (active === 'body') {
      $('bodyNameInput').value = item.name;
      $('bodyAliasesInput').value = (item.aliases || []).join(', ');
      $('bodySizeInput').value = item.size;
      $('bodyLabelOffsetInput').value = item.labelOffset;
      populateGroupSelect(item.groupId);
      $('radiusInput').value = item.orbit.radius;
      $('phaseInput').value = round(normDeg(item.orbit.phase),3);
      $('eccentricityInput').value = item.orbit.eccentricity;
      $('rotationInput').value = item.orbit.rotation;
      $('inclinationInput').value = item.orbit.inclination;
      $('nodeInput').value = item.orbit.node;
      $('offsetXInput').value = item.orbit.offsetX;
      $('offsetYInput').value = item.orbit.offsetY;
      $('orbitPeriodInput').value = item.motion.orbitPeriodDays || 0;
      $('rotationPeriodInput').value = item.motion.rotationPeriodHours || 0;
      $('orbitRetrogradeInput').checked = item.motion.orbitDirection < 0;
      $('spinRetrogradeInput').checked = item.motion.rotationDirection < 0;
      $('bodyInteractionInput').value = item.interaction.type || 'popup';
      populateSceneSelect('bodySceneTargetInput', item.interaction.target);
      $('bodyLoreIdInput').value = item.loreId || '';
      $('showOrbitInput').checked = Boolean(item.showOrbit);
      $('showBodyLabelInput').checked = Boolean(item.showLabel);
      setOpenSceneButton('openBodySceneBtn', item);
    } else if (active === 'group') {
      $('groupNameInput').value = item.name;
      $('groupRadiusInput').value = item.anchor.radius;
      $('groupThetaInput').value = item.anchor.theta;
      $('groupInclinationInput').value = item.anchor.inclination;
      $('groupCollapsedInput').checked = Boolean(item.collapsed);
      $('groupInteractiveInput').checked = Boolean(item.interactive);
      $('groupInteractionInput').value = item.interaction.type || 'expand';
      populateSceneSelect('groupSceneTargetInput', item.interaction.target);
      $('groupLoreIdInput').value = item.loreId || '';
      setOpenSceneButton('openGroupSceneBtn', item);
    } else if (active === 'region') {
      $('regionNameInput').value = item.name;
      populateSharedBodySelect('regionSharedWithInput', item.sharedWith);
      $('regionRadiusInput').value = item.radius;
      $('regionPhaseInput').value = item.phase;
      $('regionSpanInput').value = item.span;
      $('regionInclinationInput').value = item.inclination;
      $('regionInteractionInput').value = item.interaction.type || 'popup';
      populateSceneSelect('regionSceneTargetInput', item.interaction.target);
      $('regionLoreIdInput').value = item.loreId || '';
      setOpenSceneButton('openRegionSceneBtn', item);
    } else if (active === 'poi') {
      $('poiNameInput').value = item.name;
      populateSharedBodySelect('poiSharedWithInput', item.sharedWith);
      $('poiRadiusInput').value = item.radius;
      $('poiThetaInput').value = item.sharedWith ? item.phaseOffset : item.theta;
      $('poiInclinationInput').value = item.inclination;
      $('poiSymbolInput').value = item.symbol || '◆';
      $('poiInteractionInput').value = item.interaction.type || 'popup';
      populateSceneSelect('poiSceneTargetInput', item.interaction.target);
      $('poiLoreIdInput').value = item.loreId || '';
      setOpenSceneButton('openPoiSceneBtn', item);
    } else if (active === 'portal') {
      $('portalNameInput').value = item.name;
      $('portalThetaInput').value = item.theta;
      $('portalInclinationInput').value = item.inclination;
      $('portalTypeInput').value = item.type || 'phlogiston';
      $('portalInteractionInput').value = item.interaction.type || 'popup';
      populateSceneSelect('portalSceneTargetInput', item.interaction.target);
      $('portalLoreIdInput').value = item.loreId || '';
      setOpenSceneButton('openPortalSceneBtn', item);
    }
  }

  function renderBreadcrumbs() {
    const nav = $('breadcrumbs'); clear(nav);
    const byId = new Map(state.atlas.scenes.map((s) => [s.id, s]));
    const chain = [];
    let scene = currentScene();
    const seen = new Set();
    while (scene && !seen.has(scene.id)) { chain.unshift(scene); seen.add(scene.id); scene = byId.get(scene.parentSceneId); }
    chain.forEach((s, i) => {
      if (i) { const sep = document.createElement('span'); sep.className = 'crumb-sep'; sep.textContent = '›'; nav.appendChild(sep); }
      const b = document.createElement('button'); b.type = 'button'; b.className = `crumb${s.id === state.sceneId ? ' current' : ''}`; b.textContent = s.name;
      if (s.id !== state.sceneId) b.addEventListener('click', () => navigateScene(s.id));
      nav.appendChild(b);
    });
  }

  function renderMap() {
    const scene = currentScene();
    const shellLayer = $('shellLayer'), regionLayer = $('regionLayer'), orbitLayer = $('orbitLayer'), centerLayer = $('centerLayer'), groupLayer = $('groupLayer'), bodyLayer = $('bodyLayer'), poiLayer = $('poiLayer'), portalLayer = $('portalLayer'), labelLayer = $('labelLayer'), titleLayer = $('titleLayer');
    [shellLayer,regionLayer,orbitLayer,centerLayer,groupLayer,bodyLayer,poiLayer,portalLayer,labelLayer,titleLayer].forEach(clear);

    if (scene.shell.show && scene.shell.radius > 0) {
      const r = scene.shell.radius * mapScale(scene);
      shellLayer.appendChild(svgEl('circle',{cx:CENTER.x,cy:CENTER.y,r,class:'shell-line'}));
      const t = svgEl('text',{x:CENTER.x,y:CENTER.y-r+22,class:'shell-label'}); t.textContent = scene.shell.label || 'Crystal Shell'; shellLayer.appendChild(t);
    }

    scene.regions.forEach((region) => {
      const path = svgEl('path',{d:regionPathData(region,scene),class:`region-path${state.selection.kind==='region'&&state.selection.id===region.id?' selected':''}`,'data-kind':'region','data-id':region.id});
      path.addEventListener('click',(e)=>{e.stopPropagation();setSelection('region',region.id);});
      path.addEventListener('dblclick',(e)=>{e.stopPropagation();followInteraction(region);});
      regionLayer.appendChild(path);
      if (region.showLabel) {
        const p = orbitPoint(regionOrbit(region,scene), regionPhase(region,scene), scene);
        const label = svgEl('text',{x:p.x,y:p.y-20,class:'feature-label'}); label.textContent=region.name; labelLayer.appendChild(label);
      }
    });

    scene.bodies.forEach((body) => {
      if (bodyHiddenByGroup(body,scene) || !body.showOrbit) return;
      const path = svgEl('path',{d:orbitPathData(body.orbit,scene),class:`orbit-path${state.selection.kind==='body'&&state.selection.id===body.id?' selected':''}`});
      path.addEventListener('click',()=>setSelection('body',body.id)); orbitLayer.appendChild(path);
    });

    const csize = clamp(Number(scene.center.size)||62,8,240);
    centerLayer.appendChild(svgEl('circle',{cx:CENTER.x,cy:CENTER.y,r:csize*.85,fill:'url(#centerGlow)',filter:'url(#softGlow)'}));
    if (scene.center.image) {
      const img=svgEl('image',{href:scene.center.image,x:CENTER.x-csize/2,y:CENTER.y-csize/2,width:csize,height:csize,preserveAspectRatio:'xMidYMid meet'});
      if (scene.center.motion?.spinSymbol) img.setAttribute('transform',`rotate(${rotationAtTime(scene.center)} ${CENTER.x} ${CENTER.y})`);
      centerLayer.appendChild(img);
    } else {
      centerLayer.appendChild(svgEl('circle',{cx:CENTER.x,cy:CENTER.y,r:csize*.34,class:'center-core'}));
      if (scene.center.motion?.spinSymbol) {
        const a=deg(rotationAtTime(scene.center)); const rr=csize*.27;
        centerLayer.appendChild(svgEl('line',{x1:CENTER.x-Math.cos(a)*rr,y1:CENTER.y-Math.sin(a)*rr,x2:CENTER.x+Math.cos(a)*rr,y2:CENTER.y+Math.sin(a)*rr,class:'spin-mark'}));
      }
    }
    const cl=svgEl('text',{x:CENTER.x,y:CENTER.y+csize/2+30,class:'center-label'}); cl.textContent=scene.center.name; labelLayer.appendChild(cl);

    scene.groups.filter((g)=>g.collapsed).forEach((group)=>{
      const p=polarPoint(group.anchor.radius,group.anchor.theta,group.anchor.inclination,scene); const size=clamp(Number(group.size)||62,20,160);
      groupLayer.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:size*.38,class:'group-symbol'}));
      const tx=svgEl('text',{x:p.x,y:p.y+5,class:'feature-label'}); tx.textContent=`${groupMemberCount(group,scene)}`; groupLayer.appendChild(tx);
      const hit=svgEl('circle',{cx:p.x,cy:p.y,r:Math.max(size*.55,24),class:'feature-hit'});
      hit.addEventListener('click',(e)=>{e.stopPropagation();setSelection('group',group.id);});
      hit.addEventListener('dblclick',(e)=>{e.stopPropagation(); if(group.interaction.type==='expand'){group.collapsed=false;render();}else followInteraction(group);});
      groupLayer.appendChild(hit);
      const label=svgEl('text',{x:p.x,y:p.y+size*.55+18,class:'feature-label'}); label.textContent=`${group.name} ×${groupMemberCount(group,scene)}`; labelLayer.appendChild(label);
    });

    scene.bodies.forEach((body)=>{
      if(bodyHiddenByGroup(body,scene)) return;
      const p=orbitPoint(body.orbit,phaseAtTime(body),scene); const size=clamp(Number(body.size)||42,8,240);
      const g=svgEl('g',{'data-kind':'body','data-id':body.id,role:'button','aria-label':body.name});
      if(body.image){
        const image=svgEl('image',{href:body.image,x:p.x-size/2,y:p.y-size/2,width:size,height:size,preserveAspectRatio:'xMidYMid meet','pointer-events':'none'});
        if(body.motion?.spinSymbol) image.setAttribute('transform',`rotate(${rotationAtTime(body)} ${p.x} ${p.y})`);
        g.appendChild(image);
      } else {
        g.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:size*.34,class:'body-fallback','pointer-events':'none'}));
        if(body.motion?.spinSymbol){const a=deg(rotationAtTime(body)),rr=size*.28;g.appendChild(svgEl('line',{x1:p.x-Math.cos(a)*rr,y1:p.y-Math.sin(a)*rr,x2:p.x+Math.cos(a)*rr,y2:p.y+Math.sin(a)*rr,class:'spin-mark','pointer-events':'none'}));}
      }
      if(state.selection.kind==='body'&&state.selection.id===body.id) g.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:size*.58+5,class:'body-selected-ring'}));
      const hit=svgEl('circle',{cx:p.x,cy:p.y,r:Math.max(size*.62,18),class:'body-hit','data-id':body.id});
      hit.addEventListener('pointerdown',onBodyPointerDown); hit.addEventListener('click',(e)=>{e.stopPropagation();setSelection('body',body.id);}); hit.addEventListener('dblclick',(e)=>{e.stopPropagation();followInteraction(body);});
      g.appendChild(hit); bodyLayer.appendChild(g);
      if(body.showLabel){const label=svgEl('text',{x:p.x,y:p.y+size/2+Number(body.labelOffset||0),class:'body-label'});label.textContent=body.name;labelLayer.appendChild(label);}
    });

    scene.pois.forEach((poi)=>{
      const p=poiPoint(poi,scene); const size=clamp(Number(poi.size)||13,8,40);
      const sym=svgEl('text',{x:p.x,y:p.y+size*.35,class:'feature-label','font-size':`${size*1.7}px`}); sym.textContent=poi.symbol||'◆'; poiLayer.appendChild(sym);
      if(state.selection.kind==='poi'&&state.selection.id===poi.id) poiLayer.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:size+8,class:'body-selected-ring'}));
      const hit=svgEl('circle',{cx:p.x,cy:p.y,r:Math.max(18,size+8),class:'feature-hit'}); hit.addEventListener('click',(e)=>{e.stopPropagation();setSelection('poi',poi.id);}); hit.addEventListener('dblclick',(e)=>{e.stopPropagation();followInteraction(poi);}); poiLayer.appendChild(hit);
      if(poi.showLabel){const l=svgEl('text',{x:p.x,y:p.y+size+23,class:'feature-label'});l.textContent=poi.name;labelLayer.appendChild(l);}
    });

    if(scene.shell.showPortals && scene.shell.radius>0) scene.portals.forEach((portal)=>{
      const p=polarPoint(scene.shell.radius,portal.theta,portal.inclination,scene); const r=clamp(Number(portal.size)||24,10,60)*.48;
      const diamond=svgEl('rect',{x:p.x-r,y:p.y-r,width:r*2,height:r*2,rx:2,class:p.z>=0?'portal-front':'portal-back',transform:`rotate(45 ${p.x} ${p.y})`}); portalLayer.appendChild(diamond);
      if(state.selection.kind==='portal'&&state.selection.id===portal.id) portalLayer.appendChild(svgEl('circle',{cx:p.x,cy:p.y,r:r+9,class:'body-selected-ring'}));
      const hit=svgEl('circle',{cx:p.x,cy:p.y,r:Math.max(20,r+8),class:'feature-hit'}); hit.addEventListener('click',(e)=>{e.stopPropagation();setSelection('portal',portal.id);}); hit.addEventListener('dblclick',(e)=>{e.stopPropagation();followInteraction(portal);}); portalLayer.appendChild(hit);
      if(portal.showLabel){const l=svgEl('text',{x:p.x,y:p.y+r+Number(portal.labelOffset||26),class:'feature-label'});l.textContent=portal.name;labelLayer.appendChild(l);}
    });

    const title=svgEl('text',{x:28,y:45,class:'scene-title'}); title.textContent=scene.name; titleLayer.appendChild(title);
    const sub=svgEl('text',{x:30,y:70,class:'scene-subtitle'}); sub.textContent=scene.subtitle||''; titleLayer.appendChild(sub);
  }

  function renderTime() {
    $('timeReadout').textContent = `T ${state.simDays >= 0 ? '+' : '−'}${Math.abs(state.simDays).toFixed(2)} days`;
    $('playBtn').textContent = state.playing ? '❚❚ Pause' : '▶ Play';
  }

  function render() { renderSystemFields(); renderObjectLists(); renderInspector(); renderBreadcrumbs(); renderMap(); renderTime(); }

  function navigateScene(id, replace = false) {
    if (!state.atlas.scenes.some((s)=>s.id===id)) return;
    state.sceneId = id; state.selection = {kind:null,id:null}; state.draggingId=null;
    const hash = `#scene=${encodeURIComponent(id)}`;
    if (location.hash !== hash) {
      if (replace) history.replaceState(null,'',hash); else location.hash = `scene=${encodeURIComponent(id)}`;
    }
    render();
    setStatus(`Opened scene: ${currentScene().name}.`);
  }

  function hashScene() {
    const m = location.hash.match(/(?:^#|&)scene=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function followInteraction(item) {
    const action = item?.interaction?.type || 'none';
    if (action === 'expand' && 'collapsed' in item) { item.collapsed = false; render(); setStatus(`${item.name} expanded.`); return; }
    if (action === 'scene' && item.interaction.target) { navigateScene(item.interaction.target); return; }
    if (action === 'popup') { const lore = state.atlas.lore[item.loreId] || {}; alert(`${lore.name || item.name}\n\n${lore.summary || lore.description || 'No lore entry loaded yet.'}`); }
  }

  function svgCoordinates(event) { const svg=$('kosmosSvg'); const p=svg.createSVGPoint(); p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(svg.getScreenCTM().inverse()); }

  function closestPhase(body,sx,sy){let best=phaseAtTime(body),dist=Infinity;for(let i=0;i<180;i++){const ph=i*2,p=orbitPoint(body.orbit,ph),d=(p.x-sx)**2+(p.y-sy)**2;if(d<dist){dist=d;best=ph;}}for(let d=-2;d<=2;d+=.1){const ph=best+d,p=orbitPoint(body.orbit,ph),dd=(p.x-sx)**2+(p.y-sy)**2;if(dd<dist){dist=dd;best=ph;}}return normDeg(best);}
  function onBodyPointerDown(event){event.preventDefault();event.stopPropagation();state.draggingId=event.currentTarget.dataset.id;state.selection={kind:'body',id:state.draggingId};event.currentTarget.setPointerCapture?.(event.pointerId);renderObjectLists();renderInspector();renderMap();}
  function onPointerMove(event){if(!state.draggingId)return;const body=currentScene().bodies.find((b)=>b.id===state.draggingId);if(!body)return;const p=svgCoordinates(event);setBodyDisplayedPhase(body,closestPhase(body,p.x,p.y));renderInspector();renderMap();}
  function onPointerUp(){state.draggingId=null;}

  function sanitizeInteraction(raw, fallback='popup'){return {type:['popup','scene','none','expand'].includes(raw?.type)?raw.type:fallback,target:String(raw?.target||raw?.sceneTarget||'')};}
  function sanitizeScene(raw) {
    const s=createScene(raw||{}); s.id=String(raw?.id||uid('scene')); s.name=String(raw?.name||'Scene'); s.subtitle=String(raw?.subtitle||''); s.parentSceneId=String(raw?.parentSceneId||''); s.mapUnits=String(raw?.mapUnits||'units'); s.viewRadius=Math.max(1,Number(raw?.viewRadius)||500);
    s.groups=(raw?.groups||[]).map((g)=>createGroup({...g,id:String(g.id||uid('group')),interaction:sanitizeInteraction(g.interaction||{type:g.clickAction,target:g.sceneTarget},'expand')}));
    s.bodies=(raw?.bodies||[]).map((b)=>createBody({...b,id:String(b.id||uid('body')),interaction:sanitizeInteraction(b.interaction||{type:b.sceneTarget?'scene':'popup',target:b.sceneTarget},'popup')}));
    s.regions=(raw?.regions||[]).map((r)=>createRegion({...r,id:String(r.id||uid('region')),interaction:sanitizeInteraction(r.interaction||{type:r.sceneTarget?'scene':'popup',target:r.sceneTarget},'popup')}));
    s.pois=(raw?.pois||[]).map((p)=>createPoi({...p,id:String(p.id||uid('poi')),interaction:sanitizeInteraction(p.interaction||{type:p.sceneTarget?'scene':'popup',target:p.sceneTarget},'popup')}));
    s.portals=(raw?.portals||[]).map((p)=>createPortal({...p,id:String(p.id||uid('portal')),interaction:sanitizeInteraction(p.interaction||{type:p.sceneTarget?'scene':'popup',target:p.sceneTarget},'popup')}));
    return s;
  }

  function upgradeV02(raw) {
    const scene=sanitizeScene({id:'root',name:raw.name||'Imported Kosmos',subtitle:raw.subtitle||'',mapUnits:raw.mapUnits||'units',viewRadius:raw.viewRadius||500,center:raw.sun||{name:'Sun'},shell:raw.shell||{},groups:raw.groups||[],bodies:raw.bodies||[],regions:raw.regions||[],pois:raw.pois||[],portals:raw.portals||[]});
    return {schema:'kosmos-kreator/v0.3',name:raw.name||'Imported Kosmos Atlas',rootSceneId:scene.id,scenes:[scene],lore:raw.lore||{},exportProfile:{htmlStartPlaying:false}};
  }

  function sanitizeAtlas(raw) {
    if (!raw || !Array.isArray(raw.scenes)) return upgradeV02(raw||{});
    const scenes=raw.scenes.map(sanitizeScene);
    const root=String(raw.rootSceneId||scenes[0]?.id||'');
    return {schema:'kosmos-kreator/v0.3',name:String(raw.name||'Kosmos Atlas'),rootSceneId:scenes.some((s)=>s.id===root)?root:(scenes[0]?.id||''),scenes,lore:raw.lore&&typeof raw.lore==='object'?raw.lore:{},exportProfile:{htmlStartPlaying:Boolean(raw.exportProfile?.htmlStartPlaying)}};
  }

  function normalizeLore(raw) {
    if (!raw || typeof raw !== 'object') return {};
    if (raw.lore && typeof raw.lore === 'object' && !Array.isArray(raw.lore)) return raw.lore;
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw.entries) ? raw.entries : Array.isArray(raw.locations) ? raw.locations : null;
    if (arr) { const out={}; arr.forEach((x)=>{if(x&&typeof x==='object'&&x.id)out[String(x.id)]=x;}); return out; }
    return raw;
  }

  function downloadText(filename,text,type){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function safeFilename(name,ext){const base=String(name||'kosmos').trim().replace(/[^a-z0-9-_]+/gi,'-').replace(/^-+|-+$/g,'')||'kosmos';return `${base}.${ext}`;}
  function saveJson(){downloadText(safeFilename(state.atlas.name,'json'),JSON.stringify(state.atlas,null,2),'application/json');setStatus('Saved atlas JSON.');}
  function exportSvg(){const clone=$('kosmosSvg').cloneNode(true);clone.setAttribute('xmlns',SVG_NS);clone.setAttribute('width',String(VIEW_W));clone.setAttribute('height',String(VIEW_H));clone.querySelectorAll('.body-hit,.feature-hit,.body-selected-ring').forEach((n)=>n.remove());clone.querySelectorAll('.orbit-path.selected,.region-path.selected').forEach((n)=>n.classList.remove('selected'));const xml=`<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;downloadText(safeFilename(`${currentScene().name}-T${round(state.simDays,2)}`,'svg'),xml,'image/svg+xml');setStatus('Exported current animated state as a static SVG snapshot.');}

  function interactiveExportHtml(){
    const data=JSON.stringify(state.atlas).replace(/</g,'\\u003c');
    const initial=JSON.stringify(state.sceneId); const sim=Number(state.simDays)||0; const start=Boolean(state.atlas.exportProfile?.htmlStartPlaying);
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(state.atlas.name)}</title><style>html,body{margin:0;height:100%;background:#03050d;color:#eef2ff;font-family:system-ui,sans-serif}body{display:grid;grid-template-rows:48px 1fr}.bar{display:flex;align-items:center;gap:8px;padding:7px 12px;background:#0c1020;border-bottom:1px solid #2b3048;overflow:auto}.bar button{background:#191e31;color:#eef2ff;border:1px solid #2b3048;border-radius:7px;padding:6px 9px}.crumb{cursor:pointer;color:#b9c1df}.current{color:#7de4ff;font-weight:700}.sep{color:#596184}.wrap{position:relative;min-height:0}.map{width:100%;height:100%;display:block}.popup{position:absolute;right:16px;top:16px;width:min(360px,calc(100% - 32px));background:#111628;border:1px solid #465071;border-radius:12px;padding:14px;box-shadow:0 16px 60px #0009}.popup[hidden]{display:none}.popup h2{margin:0 30px 8px 0}.close{position:absolute;right:10px;top:10px}.label{fill:#eef2ff;font-size:16px;text-anchor:middle;paint-order:stroke;stroke:#03050d;stroke-width:5px}.orbit{fill:none;stroke:#8a91b1;stroke-width:1.2;opacity:.48}.region{fill:none;stroke:#d5b36a;stroke-width:16;opacity:.18;stroke-linecap:round}.hit{fill:transparent;cursor:pointer}.body{fill:#7682b2;stroke:#dbe3ff;stroke-width:2}.center{fill:#ffd266;stroke:#fff2b3;stroke-width:2}.shell{fill:none;stroke:#87bbd1;stroke-width:2;stroke-dasharray:8 8;opacity:.55}.portal{fill:#65e3ff;stroke:#d9f8ff;stroke-width:2}.back{opacity:.55;stroke-dasharray:3 3}.group{fill:#342a58;stroke:#c9b7ff;stroke-width:2}</style></head><body><div class="bar"><div id="bc"></div><span style="margin-left:auto" id="clock"></span><button id="play">${start?'Pause':'Play'}</button></div><div class="wrap"><svg id="map" class="map" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#03050d"/></svg><aside id="popup" class="popup" hidden><button id="close" class="close">×</button><h2 id="pt"></h2><div id="pb"></div></aside></div><script>const A=${data};let sid=${initial},t=${sim},playing=${start},last=0;const W=1200,H=800,C={x:600,y:400},svg=document.getElementById('map');const D=x=>x*Math.PI/180,N=x=>((+x%360)+360)%360,cl=(x,a,b)=>Math.min(b,Math.max(a,x));function S(){return A.scenes.find(x=>x.id===sid)||A.scenes[0]}function sc(){return Math.min(W,H)*.43/Math.max(1,+S().viewRadius||1)}function phase(b){let p=+b.orbit.phase||0,d=+b.motion?.orbitDirection<0?-1:1,q=+b.motion?.orbitPeriodDays||0;return N(p+(q?d*360*t/q:0))}function op(o,p){let a=Math.max(.0001,+o.radius||.0001),e=cl(+o.eccentricity||0,0,.94),bb=a*Math.sqrt(1-e*e),E=D(N(p)-90),x=a*(Math.cos(E)-e),y=bb*Math.sin(E),z=0,ar=D(+o.rotation||0);[x,y]=[x*Math.cos(ar)-y*Math.sin(ar),x*Math.sin(ar)+y*Math.cos(ar)];let inc=D(cl(+o.inclination||0,-89,89));[y,z]=[y*Math.cos(inc),y*Math.sin(inc)];let no=D(+o.node||0);[x,y]=[x*Math.cos(no)-y*Math.sin(no),x*Math.sin(no)+y*Math.cos(no)];x+=+o.offsetX||0;y+=+o.offsetY||0;let q=sc();return{x:C.x+x*q,y:C.y+y*q,z}}function pp(r,th,inc=0){th=D(N(th));inc=D(cl(+inc||0,-90,90));let pl=(+r||0)*Math.cos(inc),q=sc();return{x:C.x+pl*Math.sin(th)*q,y:C.y-pl*Math.cos(th)*q,z:(+r||0)*Math.sin(inc)}}function path(o){let d='';for(let i=0;i<=160;i++){let p=op(o,i/160*360);d+=(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)+' '}return d+'Z'}function E(tag,a={}){let e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(let[k,v]of Object.entries(a))e.setAttribute(k,v);return e}function lore(x){let l=A.lore[x.loreId]||{};document.getElementById('pt').textContent=l.name||x.name;document.getElementById('pb').textContent=l.summary||l.description||'No lore entry loaded.';document.getElementById('popup').hidden=false}function act(x){let q=x.interaction||{};if(q.type==='expand'&&'collapsed'in x){x.collapsed=false;draw();return}if(q.type==='scene'&&q.target){go(q.target);return}if(q.type==='popup')lore(x)}function go(id){if(!A.scenes.some(s=>s.id===id))return;sid=id;location.hash='scene='+encodeURIComponent(id);document.getElementById('popup').hidden=true;draw()}function regionOrbit(r,s){let b=s.bodies.find(x=>x.id===r.sharedWith);return b?{...b.orbit}:{radius:r.radius,phase:r.phase,eccentricity:0,rotation:0,inclination:r.inclination,node:r.node||0,offsetX:0,offsetY:0}}function regionPhase(r,s){let b=s.bodies.find(x=>x.id===r.sharedWith);return b?phase(b)+(+r.phase||0):(+r.phase||0)}function regPath(r,s){let o=regionOrbit(r,s),m=regionPhase(r,s),span=cl(+r.span||45,1,360),n=Math.max(8,Math.ceil(span/4)),d='';for(let i=0;i<=n;i++){let p=op(o,m-span/2+span*i/n);d+=(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)+' '}return d}function poiP(p,s){let b=s.bodies.find(x=>x.id===p.sharedWith);return b?op(b.orbit,phase(b)+(+p.phaseOffset||0)):pp(p.radius,p.theta,p.inclination)}function draw(){let s=S();svg.innerHTML='<rect width="1200" height="800" fill="#03050d"/>';if(s.shell.show&&s.shell.radius){let r=s.shell.radius*sc();svg.append(E('circle',{cx:600,cy:400,r,class:'shell'}));}for(let r of s.regions){let e=E('path',{d:regPath(r,s),class:'region hit'});e.onclick=()=>act(r);svg.append(e)}for(let b of s.bodies){let g=s.groups.find(x=>x.id===b.groupId);if(g?.collapsed)continue;if(b.showOrbit)svg.append(E('path',{d:path(b.orbit),class:'orbit'}));let p=op(b.orbit,phase(b)),c=E('circle',{cx:p.x,cy:p.y,r:Math.max(7,(+b.size||42)*.34),class:'body hit'});c.onclick=()=>act(b);svg.append(c);if(b.showLabel){let q=E('text',{x:p.x,y:p.y+(+b.size||42)/2+(+b.labelOffset||34),class:'label'});q.textContent=b.name;svg.append(q)}}for(let g of s.groups.filter(x=>x.collapsed)){let p=pp(g.anchor.radius,g.anchor.theta,g.anchor.inclination),c=E('circle',{cx:p.x,cy:p.y,r:(+g.size||62)*.38,class:'group hit'});c.onclick=()=>act(g);svg.append(c);let q=E('text',{x:p.x,y:p.y+(+g.size||62)*.55+18,class:'label'});q.textContent=g.name+' ×'+s.bodies.filter(b=>b.groupId===g.id).length;svg.append(q)}svg.append(E('circle',{cx:600,cy:400,r:Math.max(8,(+s.center.size||62)*.34),class:'center'}));let ct=E('text',{x:600,y:400+(+s.center.size||62)/2+30,class:'label'});ct.textContent=s.center.name;svg.append(ct);for(let p0 of s.pois){let p=poiP(p0,s),q=E('text',{x:p.x,y:p.y+5,class:'label'});q.textContent=p0.symbol||'◆';q.style.cursor='pointer';q.onclick=()=>act(p0);svg.append(q);if(p0.showLabel){let l=E('text',{x:p.x,y:p.y+28,class:'label'});l.textContent=p0.name;svg.append(l)}}if(s.shell.showPortals&&s.shell.radius)for(let p0 of s.portals){let p=pp(s.shell.radius,p0.theta,p0.inclination),r=10,c=E('rect',{x:p.x-r,y:p.y-r,width:20,height:20,transform:'rotate(45 '+p.x+' '+p.y+')',class:'portal hit '+(p.z<0?'back':'')});c.onclick=()=>act(p0);svg.append(c)}let title=E('text',{x:28,y:45,class:'label'});title.setAttribute('text-anchor','start');title.setAttribute('font-size','28');title.textContent=s.name;svg.append(title);breadcrumbs();document.getElementById('clock').textContent='T '+(t>=0?'+':'−')+Math.abs(t).toFixed(2)+' days'}function breadcrumbs(){let d=document.getElementById('bc');d.innerHTML='';let m=new Map(A.scenes.map(s=>[s.id,s])),c=[],s=S(),seen=new Set;while(s&&!seen.has(s.id)){c.unshift(s);seen.add(s.id);s=m.get(s.parentSceneId)}c.forEach((s,i)=>{if(i){let z=document.createElement('span');z.textContent=' › ';z.className='sep';d.append(z)}let b=document.createElement('span');b.textContent=s.name;b.className='crumb '+(s.id===sid?'current':'');if(s.id!==sid)b.onclick=()=>go(s.id);d.append(b)})}document.getElementById('close').onclick=()=>document.getElementById('popup').hidden=true;document.getElementById('play').onclick=()=>{playing=!playing;document.getElementById('play').textContent=playing?'Pause':'Play'};window.onhashchange=()=>{let m=location.hash.match(/scene=([^&]+)/);if(m&&A.scenes.some(s=>s.id===decodeURIComponent(m[1]))){sid=decodeURIComponent(m[1]);draw()}};function tick(ts){if(!last)last=ts;if(playing){t+=(ts-last)/1000;draw()}last=ts;requestAnimationFrame(tick)}let h=location.hash.match(/scene=([^&]+)/);if(h&&A.scenes.some(s=>s.id===decodeURIComponent(h[1])))sid=decodeURIComponent(h[1]);draw();requestAnimationFrame(tick);<\/script></body></html>`;
  }
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function exportHtml(){downloadText(safeFilename(`${state.atlas.name}-interactive`,'html'),interactiveExportHtml(),'text/html');setStatus('Exported interactive atlas HTML.');}

  function openJsonFile(file){const r=new FileReader();r.onload=()=>{try{state.atlas=sanitizeAtlas(JSON.parse(String(r.result)));state.sceneId=state.atlas.rootSceneId;state.simDays=0;state.selection={kind:null,id:null};navigateScene(hashScene()&&state.atlas.scenes.some(s=>s.id===hashScene())?hashScene():state.sceneId,true);setStatus(`Opened ${file.name}.`);}catch(e){console.error(e);alert('That file is not valid Kosmos JSON.');setStatus('Could not read that JSON file.');}};r.readAsText(file);}
  function loadLoreFile(file){const r=new FileReader();r.onload=()=>{try{const lore=normalizeLore(JSON.parse(String(r.result)));state.atlas.lore={...state.atlas.lore,...lore};setStatus(`Loaded ${Object.keys(lore).length} lore entries.`);}catch(e){console.error(e);alert('Could not read lore JSON.');}};r.readAsText(file);}

  function fitObjects(){const s=currentScene();let ext=1;for(const b of s.bodies){const a=+b.orbit.radius||0,off=Math.hypot(+b.orbit.offsetX||0,+b.orbit.offsetY||0);ext=Math.max(ext,a*(1+clamp(+b.orbit.eccentricity||0,0,.94))+off);}for(const p of s.pois) ext=Math.max(ext,+p.radius||0);for(const g of s.groups) ext=Math.max(ext,+g.anchor.radius||0);if(s.shell.show)ext=Math.max(ext,+s.shell.radius||0);s.viewRadius=Math.ceil(ext*1.12);render();setStatus('View fitted to scene objects.');}
  function fitShell(){const s=currentScene();if(!s.shell.radius)return;s.viewRadius=Math.ceil(+s.shell.radius*1.08);render();setStatus('View fitted to shell.');}

  function mutate(kind,fn){const x=selected(kind);if(!x)return;fn(x);renderObjectLists();renderInspector();renderMap();}
  function wireNum(id,kind,setter,opts={}){$(id).addEventListener('input',(e)=>{const v=+e.target.value;if(!Number.isFinite(v))return;mutate(kind,(x)=>setter(x,opts.normalize?normDeg(v):v));});}
  function wireText(id,kind,setter){$(id).addEventListener('input',(e)=>mutate(kind,(x)=>setter(x,e.target.value)));}
  function wireInteraction(prefix,kind){$(`${prefix}InteractionInput`).addEventListener('change',(e)=>mutate(kind,(x)=>{x.interaction.type=e.target.value;}));$(`${prefix}SceneTargetInput`).addEventListener('change',(e)=>mutate(kind,(x)=>{x.interaction.target=e.target.value;}));$(`${prefix}LoreIdInput`).addEventListener('input',(e)=>mutate(kind,(x)=>{x.loreId=e.target.value;}));}

  function deleteSelected(kind){const x=selected(kind);if(!x)return;if(!confirm(`Delete ${x.name}?`))return;const s=currentScene();s[kind==='body'?'bodies':kind==='group'?'groups':kind==='region'?'regions':kind==='poi'?'pois':'portals']=collectionFor(kind).filter((y)=>y.id!==x.id);if(kind==='group')s.bodies.forEach((b)=>{if(b.groupId===x.id)b.groupId='';});state.selection={kind:null,id:null};render();setStatus(`${x.name} deleted.`);}

  function wireUi(){
    $('systemNameInput').addEventListener('input',(e)=>{state.atlas.name=e.target.value;});
    $('sceneSelect').addEventListener('change',(e)=>navigateScene(e.target.value));
    $('sceneNameInput').addEventListener('input',(e)=>{currentScene().name=e.target.value;renderBreadcrumbs();renderObjectLists();renderMap();});
    $('sceneSubtitleInput').addEventListener('input',(e)=>{currentScene().subtitle=e.target.value;renderMap();});
    $('viewRadiusInput').addEventListener('input',(e)=>{const v=+e.target.value;if(v>0){currentScene().viewRadius=v;renderMap();}});
    $('mapUnitsInput').addEventListener('input',(e)=>{currentScene().mapUnits=e.target.value;});
    $('centerNameInput').addEventListener('input',(e)=>{currentScene().center.name=e.target.value;renderMap();});
    $('shellRadiusInput').addEventListener('input',(e)=>{const v=+e.target.value;if(Number.isFinite(v)){currentScene().shell.radius=Math.max(0,v);renderMap();}});
    $('shellTravelDaysInput').addEventListener('input',(e)=>{const v=+e.target.value;if(Number.isFinite(v))currentScene().shell.travelDays=Math.max(0,v);});
    $('shellLabelInput').addEventListener('input',(e)=>{currentScene().shell.label=e.target.value;renderMap();});
    $('showShellInput').addEventListener('change',(e)=>{currentScene().shell.show=e.target.checked;renderMap();});
    $('showPortalsInput').addEventListener('change',(e)=>{currentScene().shell.showPortals=e.target.checked;renderMap();});

    $('newSystemBtn').onclick=()=>{if(!confirm('Start a new atlas? Unsaved changes in this browser tab will be lost.'))return;state.atlas=createBlankAtlas();state.sceneId=state.atlas.rootSceneId;state.simDays=0;navigateScene(state.sceneId,true);setStatus('New atlas created.');};
    $('loadRealmspaceBtn').onclick=()=>{state.atlas=realmspaceAtlas();state.sceneId='realmspace';state.simDays=0;navigateScene('realmspace',true);setStatus('Realmspace atlas loaded.');};
    $('openJsonBtn').onclick=()=>$('openJsonInput').click(); $('openJsonInput').onchange=(e)=>{const f=e.target.files?.[0];if(f)openJsonFile(f);e.target.value='';};
    $('loadLoreBtn').onclick=()=>$('loadLoreInput').click(); $('loadLoreInput').onchange=(e)=>{const f=e.target.files?.[0];if(f)loadLoreFile(f);e.target.value='';};
    $('saveJsonBtn').onclick=saveJson; $('exportSvgBtn').onclick=exportSvg; $('exportHtmlBtn').onclick=exportHtml; $('fitViewBtn').onclick=fitObjects; $('fitShellBtn').onclick=fitShell;

    $('addSceneBtn').onclick=()=>{const s=createScene({name:`Scene ${state.atlas.scenes.length+1}`,parentSceneId:state.sceneId});state.atlas.scenes.push(s);navigateScene(s.id);setStatus(`${s.name} created.`);};
    $('deleteSceneBtn').onclick=()=>{const s=currentScene();if(state.atlas.scenes.length<=1)return alert('An atlas needs at least one scene.');if(!confirm(`Delete scene ${s.name}? Links to it will remain until edited.`))return;state.atlas.scenes=state.atlas.scenes.filter(x=>x.id!==s.id);if(state.atlas.rootSceneId===s.id)state.atlas.rootSceneId=state.atlas.scenes[0].id;navigateScene(s.parentSceneId&&state.atlas.scenes.some(x=>x.id===s.parentSceneId)?s.parentSceneId:state.atlas.rootSceneId,true);};

    $('addBodyBtn').onclick=()=>{const b=createBody({name:`World ${currentScene().bodies.length+1}`});currentScene().bodies.push(b);setSelection('body',b.id);};
    $('addGroupBtn').onclick=()=>{const g=createGroup({name:`Group ${currentScene().groups.length+1}`});currentScene().groups.push(g);setSelection('group',g.id);};
    $('addRegionBtn').onclick=()=>{const r=createRegion({name:`Region ${currentScene().regions.length+1}`});currentScene().regions.push(r);setSelection('region',r.id);};
    $('addPoiBtn').onclick=()=>{const p=createPoi({name:`Point ${currentScene().pois.length+1}`});currentScene().pois.push(p);setSelection('poi',p.id);};
    $('addPortalBtn').onclick=()=>{const p=createPortal({name:`Portal ${currentScene().portals.length+1}`});currentScene().portals.push(p);setSelection('portal',p.id);};
    $('deleteBodyBtn').onclick=()=>deleteSelected('body');$('deleteGroupBtn').onclick=()=>deleteSelected('group');$('deleteRegionBtn').onclick=()=>deleteSelected('region');$('deletePoiBtn').onclick=()=>deleteSelected('poi');$('deletePortalBtn').onclick=()=>deleteSelected('portal');

    wireText('bodyNameInput','body',(x,v)=>x.name=v);$('bodyAliasesInput').oninput=(e)=>mutate('body',(x)=>x.aliases=e.target.value.split(',').map(v=>v.trim()).filter(Boolean));wireNum('bodySizeInput','body',(x,v)=>x.size=clamp(v,8,240));wireNum('bodyLabelOffsetInput','body',(x,v)=>x.labelOffset=clamp(v,0,160));$('bodyGroupSelect').onchange=(e)=>mutate('body',(x)=>x.groupId=e.target.value);wireNum('radiusInput','body',(x,v)=>x.orbit.radius=Math.max(0,v));wireNum('phaseInput','body',(x,v)=>x.orbit.phase=normDeg(v));wireNum('eccentricityInput','body',(x,v)=>x.orbit.eccentricity=clamp(v,0,.94));wireNum('rotationInput','body',(x,v)=>x.orbit.rotation=normDeg(v));wireNum('inclinationInput','body',(x,v)=>x.orbit.inclination=clamp(v,-89,89));wireNum('nodeInput','body',(x,v)=>x.orbit.node=normDeg(v));wireNum('offsetXInput','body',(x,v)=>x.orbit.offsetX=v);wireNum('offsetYInput','body',(x,v)=>x.orbit.offsetY=v);wireNum('orbitPeriodInput','body',(x,v)=>x.motion.orbitPeriodDays=Math.max(0,v));wireNum('rotationPeriodInput','body',(x,v)=>x.motion.rotationPeriodHours=v);$('orbitRetrogradeInput').onchange=(e)=>mutate('body',(x)=>x.motion.orbitDirection=e.target.checked?-1:1);$('spinRetrogradeInput').onchange=(e)=>mutate('body',(x)=>x.motion.rotationDirection=e.target.checked?-1:1);wireInteraction('body','body');$('showOrbitInput').onchange=(e)=>mutate('body',(x)=>x.showOrbit=e.target.checked);$('showBodyLabelInput').onchange=(e)=>mutate('body',(x)=>x.showLabel=e.target.checked);
    $('chooseBodyImageBtn').onclick=()=>$('bodyImageInput').click();$('clearBodyImageBtn').onclick=()=>mutate('body',(x)=>x.image='');$('bodyImageInput').onchange=(e)=>{const f=e.target.files?.[0],b=selected('body');if(!f||!b)return;const r=new FileReader();r.onload=()=>{b.image=String(r.result||'');render();setStatus(`Embedded image for ${b.name}.`);};r.readAsDataURL(f);e.target.value='';};

    wireText('groupNameInput','group',(x,v)=>x.name=v);wireNum('groupRadiusInput','group',(x,v)=>x.anchor.radius=Math.max(0,v));wireNum('groupThetaInput','group',(x,v)=>x.anchor.theta=normDeg(v));wireNum('groupInclinationInput','group',(x,v)=>x.anchor.inclination=clamp(v,-90,90));$('groupCollapsedInput').onchange=(e)=>mutate('group',(x)=>x.collapsed=e.target.checked);$('groupInteractiveInput').onchange=(e)=>mutate('group',(x)=>x.interactive=e.target.checked);wireInteraction('group','group');
    wireText('regionNameInput','region',(x,v)=>x.name=v);$('regionSharedWithInput').onchange=(e)=>mutate('region',(x)=>x.sharedWith=e.target.value);wireNum('regionRadiusInput','region',(x,v)=>x.radius=Math.max(0,v));wireNum('regionPhaseInput','region',(x,v)=>x.phase=v);wireNum('regionSpanInput','region',(x,v)=>x.span=clamp(v,1,360));wireNum('regionInclinationInput','region',(x,v)=>x.inclination=clamp(v,-89,89));wireInteraction('region','region');
    wireText('poiNameInput','poi',(x,v)=>x.name=v);$('poiSharedWithInput').onchange=(e)=>mutate('poi',(x)=>x.sharedWith=e.target.value);wireNum('poiRadiusInput','poi',(x,v)=>x.radius=Math.max(0,v));wireNum('poiThetaInput','poi',(x,v)=>{if(x.sharedWith)x.phaseOffset=v;else x.theta=normDeg(v);});wireNum('poiInclinationInput','poi',(x,v)=>x.inclination=clamp(v,-90,90));wireText('poiSymbolInput','poi',(x,v)=>x.symbol=v||'◆');wireInteraction('poi','poi');
    wireText('portalNameInput','portal',(x,v)=>x.name=v);wireNum('portalThetaInput','portal',(x,v)=>x.theta=normDeg(v));wireNum('portalInclinationInput','portal',(x,v)=>x.inclination=clamp(v,-90,90));wireText('portalTypeInput','portal',(x,v)=>x.type=v);wireInteraction('portal','portal');

    $('playBtn').onclick=()=>{state.playing=!state.playing;state.lastFrame=0;renderTime();};$('stepBackBtn').onclick=()=>{state.simDays-=1;renderMap();renderTime();};$('stepForwardBtn').onclick=()=>{state.simDays+=1;renderMap();renderTime();};$('zeroTimeBtn').onclick=()=>{state.simDays=0;renderMap();renderTime();};$('speedSelect').onchange=(e)=>{state.speed=+e.target.value||1;};

    $('kosmosSvg').addEventListener('pointermove',onPointerMove);$('kosmosSvg').addEventListener('pointerup',onPointerUp);$('kosmosSvg').addEventListener('pointercancel',onPointerUp);$('kosmosSvg').addEventListener('pointerleave',(e)=>{if(e.buttons===0)onPointerUp();});$('kosmosSvg').addEventListener('click',(e)=>{if(e.target.id==='kosmosSvg'||e.target.classList.contains('space-bg'))clearSelection();});
    window.addEventListener('hashchange',()=>{const id=hashScene();if(id&&state.atlas.scenes.some(s=>s.id===id)&&id!==state.sceneId){state.sceneId=id;state.selection={kind:null,id:null};render();}});
    window.addEventListener('keydown',(e)=>{if(e.key==='Escape'){state.draggingId=null;clearSelection();}});
  }

  function animate(ts){if(!state.lastFrame)state.lastFrame=ts;const dt=(ts-state.lastFrame)/1000;if(state.playing){state.simDays+=dt*state.speed;renderMap();renderTime();}state.lastFrame=ts;requestAnimationFrame(animate);}

  state.atlas=realmspaceAtlas();
  state.sceneId=hashScene()&&state.atlas.scenes.some((s)=>s.id===hashScene())?hashScene():state.atlas.rootSceneId;
  wireUi();render();requestAnimationFrame(animate);
})();
