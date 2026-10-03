(() => {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const VIEW_W = 1200;
  const VIEW_H = 800;
  const CENTER = { x: VIEW_W / 2, y: VIEW_H / 2 };
  const ORBIT_SAMPLES = 240;

  const $ = (id) => document.getElementById(id);
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const normDeg = (d) => ((Number(d) % 360) + 360) % 360;
  const deg = (d) => Number(d) * Math.PI / 180;
  const round = (n, places = 2) => Number(Number(n).toFixed(places));
  const uid = (prefix) => crypto.randomUUID ? crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const state = {
    system: createBlankSystem(),
    selection: { kind: null, id: null },
    draggingId: null,
  };

  function createBlankSystem() {
    return {
      schema: 'kosmos-kreator/v0.2',
      name: 'Untitled Kosmos',
      subtitle: 'Crystal Sphere Interior',
      mapUnits: 'units',
      viewRadius: 500,
      sun: { name: 'Sun', size: 62 },
      shell: {
        radius: 450,
        travelDays: 0,
        label: 'Crystal Shell',
        show: false,
        showPortals: true,
      },
      groups: [],
      portals: [],
      bodies: [],
      lore: {},
    };
  }

  function createBody(overrides = {}) {
    return {
      id: uid('body'),
      name: 'New World',
      image: '',
      size: 42,
      labelOffset: 34,
      groupId: '',
      loreId: '',
      sceneTarget: '',
      orbit: {
        radius: 200,
        phase: 0,
        eccentricity: 0,
        rotation: 0,
        inclination: 0,
        node: 0,
        offsetX: 0,
        offsetY: 0,
      },
      showOrbit: true,
      showLabel: true,
      ...overrides,
      orbit: {
        radius: 200,
        phase: 0,
        eccentricity: 0,
        rotation: 0,
        inclination: 0,
        node: 0,
        offsetX: 0,
        offsetY: 0,
        ...(overrides.orbit || {}),
      },
    };
  }

  function createGroup(overrides = {}) {
    return {
      id: uid('group'),
      name: 'New Group',
      collapsed: false,
      interactive: true,
      anchor: { radius: 0, theta: 0, inclination: 0 },
      size: 58,
      loreId: '',
      sceneTarget: '',
      ...overrides,
      anchor: {
        radius: 0,
        theta: 0,
        inclination: 0,
        ...(overrides.anchor || {}),
      },
    };
  }

  function createPortal(overrides = {}) {
    return {
      id: uid('portal'),
      name: 'New Portal',
      type: 'phlogiston',
      theta: 0,
      inclination: 0,
      size: 24,
      labelOffset: 26,
      showLabel: true,
      loreId: '',
      sceneTarget: '',
      ...overrides,
    };
  }

  function realmspaceDemo() {
    const inner = createGroup({
      id: 'inner-realmspace',
      name: 'Inner Worlds',
      collapsed: true,
      interactive: true,
      anchor: { radius: 0, theta: 0, inclination: 0 },
      size: 66,
      loreId: 'inner-realmspace',
      sceneTarget: 'realmspace-inner',
    });
    const innerId = inner.id;
    return {
      schema: 'kosmos-kreator/v0.2',
      name: 'Realmspace',
      subtitle: 'Crystal Sphere Interior · Wildspace Kosmos',
      mapUnits: 'million miles',
      viewRadius: 3400,
      sun: { name: 'Sol', size: 64 },
      shell: {
        radius: 3200,
        travelDays: 32,
        label: 'Crystal Shell · 32 days from Sol',
        show: true,
        showPortals: true,
      },
      groups: [inner],
      portals: [
        createPortal({ id: 'mercane-gate', name: 'Mercane Gate', type: 'phlogiston', theta: 40, inclination: 28, loreId: 'mercane-gate', sceneTarget: 'outer-mercane-flow' }),
        createPortal({ id: 'deep-gate', name: 'Deep Gate', type: 'phlogiston', theta: 218, inclination: -37, loreId: 'deep-gate', sceneTarget: 'apeiron-flow' }),
      ],
      bodies: [
        createBody({ id: 'anadia', name: 'Anadia', size: 24, groupId: innerId, loreId: 'anadia', orbit: { radius: 50, phase: 10 } }),
        createBody({ id: 'coliar', name: 'Coliar', size: 29, groupId: innerId, loreId: 'coliar', orbit: { radius: 100, phase: 150, inclination: 3, node: 35 } }),
        createBody({ id: 'toril', name: 'Toril', size: 35, groupId: innerId, loreId: 'toril', sceneTarget: 'toril-local', orbit: { radius: 200, phase: 265, inclination: 0 } }),
        createBody({ id: 'karpri', name: 'Karpri', size: 34, groupId: innerId, loreId: 'karpri', orbit: { radius: 300, phase: 330, eccentricity: 0.08, rotation: 20, inclination: 9, node: 70 } }),
        createBody({ id: 'chandos', name: 'Chandos', size: 41, groupId: innerId, loreId: 'chandos', orbit: { radius: 400, phase: 195, eccentricity: 0.05, rotation: -12, inclination: 15, node: 110 } }),
        createBody({ id: 'glyth', name: 'Glyth', size: 42, loreId: 'glyth', orbit: { radius: 1000, phase: 315, eccentricity: 0.1, rotation: 12, inclination: 7, node: 20 } }),
        createBody({ id: 'garden', name: 'Garden', size: 42, loreId: 'garden', orbit: { radius: 1200, phase: 265, eccentricity: 0.03, rotation: 50, inclination: -6, node: 150 } }),
        createBody({ id: 'hcatha', name: "H'catha", size: 38, loreId: 'hcatha', orbit: { radius: 1600, phase: 95, eccentricity: 0.14, rotation: -15, inclination: 18, node: 40 } }),
      ],
      lore: {
        'inner-realmspace': { name: 'Inner Worlds', summary: 'A cartographic group for the close-packed inner worlds. Expand it to reveal their true orbits.' },
        toril: { name: 'Toril', summary: 'Primary world of Realmspace. Attach a richer lore JSON to replace this demo entry.' },
        'mercane-gate': { name: 'Mercane Gate', summary: 'A shell portal positioned above the normal orbital plane.' },
        'deep-gate': { name: 'Deep Gate', summary: 'A lower-hemisphere passage through the Crystal Shell.' },
      },
    };
  }

  function selected(kind) {
    if (state.selection.kind !== kind) return null;
    const collection = kind === 'body' ? state.system.bodies : kind === 'group' ? state.system.groups : state.system.portals;
    return collection.find((item) => item.id === state.selection.id) || null;
  }

  function setSelection(kind, id) {
    state.selection = { kind, id };
    render();
  }

  function clearSelection() {
    state.selection = { kind: null, id: null };
    render();
  }

  function mapScale() {
    const safeRadius = Math.max(1, Number(state.system.viewRadius) || 1);
    return Math.min(VIEW_W, VIEW_H) * 0.43 / safeRadius;
  }

  function orbitPoint(body, phaseDeg) {
    const orbit = body.orbit;
    const a = Math.max(0.0001, Number(orbit.radius) || 0.0001);
    const e = clamp(Number(orbit.eccentricity) || 0, 0, 0.94);
    const b = a * Math.sqrt(1 - e * e);
    const E = deg(normDeg(phaseDeg) - 90);
    let x = a * (Math.cos(E) - e);
    let y = b * Math.sin(E);
    let z = 0;

    const arg = deg(Number(orbit.rotation) || 0);
    [x, y] = [x * Math.cos(arg) - y * Math.sin(arg), x * Math.sin(arg) + y * Math.cos(arg)];

    const inc = deg(clamp(Number(orbit.inclination) || 0, -89, 89));
    [y, z] = [y * Math.cos(inc) - z * Math.sin(inc), y * Math.sin(inc) + z * Math.cos(inc)];

    const node = deg(Number(orbit.node) || 0);
    [x, y] = [x * Math.cos(node) - y * Math.sin(node), x * Math.sin(node) + y * Math.cos(node)];

    x += Number(orbit.offsetX) || 0;
    y += Number(orbit.offsetY) || 0;

    const scale = mapScale();
    return { x: CENTER.x + x * scale, y: CENTER.y + y * scale, z, modelX: x, modelY: y };
  }

  function polarPoint(radius, thetaDeg, inclinationDeg = 0) {
    const theta = deg(normDeg(thetaDeg));
    const inc = deg(clamp(Number(inclinationDeg) || 0, -90, 90));
    const r = Number(radius) || 0;
    const planar = r * Math.cos(inc);
    const x = planar * Math.sin(theta);
    const y = -planar * Math.cos(theta);
    const z = r * Math.sin(inc);
    const scale = mapScale();
    return { x: CENTER.x + x * scale, y: CENTER.y + y * scale, z, modelX: x, modelY: y };
  }

  function orbitPathData(body) {
    let d = '';
    for (let i = 0; i <= ORBIT_SAMPLES; i += 1) {
      const p = orbitPoint(body, (i / ORBIT_SAMPLES) * 360);
      d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)} `;
    }
    return `${d}Z`;
  }

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined && value !== null) el.setAttribute(key, String(value));
    }
    return el;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function groupForBody(body) {
    if (!body.groupId) return null;
    return state.system.groups.find((group) => group.id === body.groupId) || null;
  }

  function bodyHiddenByGroup(body) {
    const group = groupForBody(body);
    return Boolean(group?.collapsed);
  }

  function groupMemberCount(group) {
    return state.system.bodies.filter((body) => body.groupId === group.id).length;
  }

  function render() {
    renderSystemFields();
    renderObjectLists();
    renderInspector();
    renderMap();
  }

  function renderSystemFields() {
    $('systemNameInput').value = state.system.name;
    $('systemSubtitleInput').value = state.system.subtitle || '';
    $('viewRadiusInput').value = state.system.viewRadius;
    $('mapUnitsInput').value = state.system.mapUnits || 'units';
    $('shellRadiusInput').value = state.system.shell.radius;
    $('shellTravelDaysInput').value = state.system.shell.travelDays ?? 0;
    $('shellLabelInput').value = state.system.shell.label || 'Crystal Shell';
    $('showShellInput').checked = Boolean(state.system.shell.show);
    $('showPortalsInput').checked = Boolean(state.system.shell.showPortals);
  }

  function objectRow(item, kind, icon, meta, image = '') {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `object-row${state.selection.kind === kind && state.selection.id === item.id ? ' selected' : ''}`;
    const iconWrap = document.createElement('span');
    iconWrap.className = 'object-icon';
    if (image) {
      const img = document.createElement('img');
      img.src = image;
      img.alt = '';
      iconWrap.appendChild(img);
    } else {
      iconWrap.textContent = icon;
    }
    const name = document.createElement('span');
    name.textContent = item.name;
    const detail = document.createElement('span');
    detail.className = 'object-meta';
    detail.textContent = meta;
    row.append(iconWrap, name, detail);
    row.addEventListener('click', () => setSelection(kind, item.id));
    return row;
  }

  function renderObjectLists() {
    const bodyList = $('bodyList');
    const groupList = $('groupList');
    const portalList = $('portalList');
    clear(bodyList); clear(groupList); clear(portalList);

    if (!state.system.groups.length) groupList.appendChild(emptyNote('No map groups yet.'));
    else state.system.groups.forEach((group) => groupList.appendChild(objectRow(group, 'group', group.collapsed ? '⊕' : '⊖', `${groupMemberCount(group)} · ${group.collapsed ? 'folded' : 'open'}`)));

    if (!state.system.bodies.length) bodyList.appendChild(emptyNote('No orbiting bodies yet.'));
    else state.system.bodies.forEach((body) => bodyList.appendChild(objectRow(body, 'body', '●', `${round(body.orbit.radius, 1)}`, body.image)));

    if (!state.system.portals.length) portalList.appendChild(emptyNote('No shell portals yet.'));
    else state.system.portals.forEach((portal) => portalList.appendChild(objectRow(portal, 'portal', '◇', `${round(normDeg(portal.theta), 0)}° / ${round(portal.inclination, 0)}°`)));
  }

  function emptyNote(text) {
    const p = document.createElement('p');
    p.className = 'field-note block';
    p.textContent = text;
    return p;
  }

  function renderInspector() {
    const body = selected('body');
    const group = selected('group');
    const portal = selected('portal');
    $('emptyInspector').hidden = Boolean(body || group || portal);
    $('bodyInspector').hidden = !body;
    $('groupInspector').hidden = !group;
    $('portalInspector').hidden = !portal;

    if (body) {
      $('selectionReadout').textContent = `${body.name} · R ${round(body.orbit.radius, 2)} · θ ${round(normDeg(body.orbit.phase), 1)}°`;
      $('bodyNameInput').value = body.name;
      $('bodySizeInput').value = body.size;
      $('labelOffsetInput').value = body.labelOffset;
      populateGroupSelect(body.groupId);
      $('radiusInput').value = body.orbit.radius;
      $('phaseInput').value = round(normDeg(body.orbit.phase), 3);
      $('eccentricityInput').value = body.orbit.eccentricity;
      $('rotationInput').value = body.orbit.rotation;
      $('inclinationInput').value = body.orbit.inclination;
      $('nodeInput').value = body.orbit.node;
      $('offsetXInput').value = body.orbit.offsetX;
      $('offsetYInput').value = body.orbit.offsetY;
      $('bodyLoreIdInput').value = body.loreId || '';
      $('bodySceneTargetInput').value = body.sceneTarget || '';
      $('showOrbitInput').checked = body.showOrbit;
      $('showLabelInput').checked = body.showLabel;
      return;
    }

    if (group) {
      $('selectionReadout').textContent = `${group.name} · ${groupMemberCount(group)} bodies · ${group.collapsed ? 'collapsed' : 'expanded'}`;
      $('groupNameInput').value = group.name;
      $('groupMemberReadout').textContent = `${groupMemberCount(group)} bodies currently belong to this group. Assign membership from each Body inspector.`;
      $('groupCollapsedInput').checked = group.collapsed;
      $('groupInteractiveInput').checked = group.interactive;
      $('groupRadiusInput').value = group.anchor.radius;
      $('groupThetaInput').value = normDeg(group.anchor.theta);
      $('groupInclinationInput').value = group.anchor.inclination;
      $('groupSizeInput').value = group.size;
      $('groupLoreIdInput').value = group.loreId || '';
      $('groupSceneTargetInput').value = group.sceneTarget || '';
      return;
    }

    if (portal) {
      $('selectionReadout').textContent = `${portal.name} · θ ${round(normDeg(portal.theta), 1)}° · inc ${round(portal.inclination, 1)}°`;
      $('portalNameInput').value = portal.name;
      $('portalTypeInput').value = portal.type;
      $('portalThetaInput').value = normDeg(portal.theta);
      $('portalInclinationInput').value = portal.inclination;
      $('portalSizeInput').value = portal.size;
      $('portalLabelOffsetInput').value = portal.labelOffset;
      $('portalLoreIdInput').value = portal.loreId || '';
      $('portalSceneTargetInput').value = portal.sceneTarget || '';
      $('portalShowLabelInput').checked = portal.showLabel;
      return;
    }

    $('selectionReadout').textContent = 'No object selected';
  }

  function populateGroupSelect(selectedId) {
    const select = $('bodyGroupInput');
    clear(select);
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'No group';
    select.appendChild(none);
    state.system.groups.forEach((group) => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      select.appendChild(option);
    });
    select.value = selectedId || '';
  }

  function renderMap() {
    const titleLayer = $('titleLayer');
    const shellLayer = $('shellLayer');
    const orbitLayer = $('orbitLayer');
    const sunLayer = $('sunLayer');
    const bodyLayer = $('bodyLayer');
    const groupLayer = $('groupLayer');
    const portalLayer = $('portalLayer');
    const labelLayer = $('labelLayer');
    [titleLayer, shellLayer, orbitLayer, sunLayer, bodyLayer, groupLayer, portalLayer, labelLayer].forEach(clear);

    const title = svgEl('text', { x: 32, y: 48, class: 'kosmos-title' });
    title.textContent = state.system.name;
    const subtitle = svgEl('text', { x: 34, y: 72, class: 'kosmos-subtitle' });
    subtitle.textContent = state.system.subtitle || '';
    titleLayer.append(title, subtitle);

    if (state.system.shell.show) {
      const shellRadiusPx = state.system.shell.radius * mapScale();
      shellLayer.appendChild(svgEl('circle', { cx: CENTER.x, cy: CENTER.y, r: shellRadiusPx, class: 'shell-path' }));
      const shellLabel = svgEl('text', { x: CENTER.x, y: CENTER.y - shellRadiusPx + 20, class: 'shell-label' });
      shellLabel.textContent = state.system.shell.label || `Crystal Shell · ${state.system.shell.travelDays || '?'} days`;
      shellLayer.appendChild(shellLabel);
    }

    state.system.bodies.forEach((body) => {
      if (bodyHiddenByGroup(body) || !body.showOrbit) return;
      const path = svgEl('path', {
        d: orbitPathData(body),
        class: `orbit-path${state.selection.kind === 'body' && body.id === state.selection.id ? ' selected' : ''}`,
      });
      path.addEventListener('click', () => setSelection('body', body.id));
      orbitLayer.appendChild(path);
    });

    const glow = svgEl('circle', { cx: CENTER.x, cy: CENTER.y, r: 58, fill: 'url(#sunGlow)', filter: 'url(#softGlow)' });
    const core = svgEl('circle', { cx: CENTER.x, cy: CENTER.y, r: 21, class: 'sun-core' });
    const sunLabel = svgEl('text', { x: CENTER.x, y: CENTER.y + 52, class: 'sun-label' });
    sunLabel.textContent = state.system.sun?.name || 'Sun';
    sunLayer.append(glow, core, sunLabel);

    state.system.bodies.forEach((body) => {
      if (bodyHiddenByGroup(body)) return;
      const p = orbitPoint(body, body.orbit.phase);
      const size = clamp(Number(body.size) || 42, 8, 240);
      const group = svgEl('g', { 'data-id': body.id, tabindex: '0', role: 'button', 'aria-label': body.name });
      if (body.image) {
        group.appendChild(svgEl('image', { href: body.image, x: p.x - size / 2, y: p.y - size / 2, width: size, height: size, preserveAspectRatio: 'xMidYMid meet', 'pointer-events': 'none' }));
      } else {
        group.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: size * 0.34, class: 'body-fallback', 'pointer-events': 'none' }));
      }
      if (state.selection.kind === 'body' && body.id === state.selection.id) group.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: size * 0.58 + 5, class: 'body-selected-ring' }));
      const hit = svgEl('circle', { cx: p.x, cy: p.y, r: Math.max(size * 0.62, 18), class: 'body-hit', 'data-id': body.id });
      hit.addEventListener('pointerdown', onBodyPointerDown);
      hit.addEventListener('click', (event) => { event.stopPropagation(); setSelection('body', body.id); });
      group.appendChild(hit);
      bodyLayer.appendChild(group);
      if (body.showLabel) {
        const label = svgEl('text', { x: p.x, y: p.y + size / 2 + Number(body.labelOffset || 0), class: 'body-label' });
        label.textContent = body.name;
        labelLayer.appendChild(label);
      }
    });

    state.system.groups.forEach((group) => {
      if (!group.collapsed) return;
      const p = polarPoint(group.anchor.radius, group.anchor.theta, group.anchor.inclination);
      const size = clamp(Number(group.size) || 58, 20, 180);
      const marker = svgEl('circle', { cx: p.x, cy: p.y, r: size / 2, class: 'group-marker' });
      const count = svgEl('text', { x: p.x, y: p.y + 5, class: 'group-label' });
      count.textContent = `×${groupMemberCount(group)}`;
      const hit = svgEl('circle', { cx: p.x, cy: p.y, r: Math.max(size / 2, 24), class: 'group-hit' });
      hit.addEventListener('click', (event) => {
        event.stopPropagation();
        group.collapsed = false;
        state.selection = { kind: 'group', id: group.id };
        render();
        setStatus(`${group.name} expanded.`);
      });
      groupLayer.append(marker, count, hit);
      const label = svgEl('text', { x: p.x, y: p.y + size / 2 + 22, class: 'group-label' });
      label.textContent = group.name;
      labelLayer.appendChild(label);
    });

    if (state.system.shell.showPortals) {
      state.system.portals.forEach((portal) => {
        const p = polarPoint(state.system.shell.radius, portal.theta, portal.inclination);
        const half = clamp(Number(portal.size) || 24, 8, 100) / 2;
        const points = `${p.x},${p.y - half} ${p.x + half},${p.y} ${p.x},${p.y + half} ${p.x - half},${p.y}`;
        const marker = svgEl('polygon', { points, class: `portal-marker ${portal.type}${p.z < 0 ? ' back' : ''}` });
        const hit = svgEl('circle', { cx: p.x, cy: p.y, r: Math.max(half + 7, 16), class: 'portal-hit' });
        hit.addEventListener('click', (event) => { event.stopPropagation(); setSelection('portal', portal.id); });
        portalLayer.append(marker, hit);
        if (state.selection.kind === 'portal' && state.selection.id === portal.id) portalLayer.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: half + 8, class: 'body-selected-ring' }));
        if (portal.showLabel) {
          const label = svgEl('text', { x: p.x, y: p.y + half + Number(portal.labelOffset || 0), class: 'portal-label' });
          label.textContent = `${portal.name} · ${portal.inclination >= 0 ? '+' : ''}${round(portal.inclination, 0)}°`;
          labelLayer.appendChild(label);
        }
      });
    }
  }

  function mutateSelected(kind, fn) {
    const item = selected(kind);
    if (!item) return;
    fn(item);
    renderObjectLists();
    renderInspector();
    renderMap();
  }

  function closestPhase(body, sx, sy) {
    let bestPhase = body.orbit.phase;
    let bestDistance = Infinity;
    const coarse = 180;
    for (let i = 0; i < coarse; i += 1) {
      const phase = i * (360 / coarse);
      const p = orbitPoint(body, phase);
      const d2 = (p.x - sx) ** 2 + (p.y - sy) ** 2;
      if (d2 < bestDistance) { bestDistance = d2; bestPhase = phase; }
    }
    const step = 360 / coarse;
    for (let delta = -step; delta <= step; delta += step / 20) {
      const phase = bestPhase + delta;
      const p = orbitPoint(body, phase);
      const d2 = (p.x - sx) ** 2 + (p.y - sy) ** 2;
      if (d2 < bestDistance) { bestDistance = d2; bestPhase = phase; }
    }
    return normDeg(bestPhase);
  }

  function svgCoordinates(event) {
    const svg = $('kosmosSvg');
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
  }

  function onBodyPointerDown(event) {
    event.preventDefault();
    event.stopPropagation();
    state.draggingId = event.currentTarget.dataset.id;
    state.selection = { kind: 'body', id: state.draggingId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    renderInspector();
    renderObjectLists();
    renderMap();
  }

  function onPointerMove(event) {
    if (!state.draggingId) return;
    const body = state.system.bodies.find((b) => b.id === state.draggingId);
    if (!body) return;
    const p = svgCoordinates(event);
    body.orbit.phase = round(closestPhase(body, p.x, p.y), 2);
    renderInspector();
    renderMap();
  }

  function onPointerUp() { state.draggingId = null; }

  function normalizeLore(raw) {
    const source = raw?.lore ?? raw?.entries ?? raw?.locations ?? raw;
    const result = {};
    if (Array.isArray(source)) {
      source.forEach((entry, index) => {
        if (!entry || typeof entry !== 'object') return;
        const id = String(entry.id || entry.slug || entry.key || entry.name || `entry-${index}`);
        result[id] = entry;
      });
      return result;
    }
    if (source && typeof source === 'object') return { ...source };
    return result;
  }

  function sanitizeSystem(raw) {
    const system = createBlankSystem();
    system.name = String(raw?.name || system.name);
    system.subtitle = String(raw?.subtitle ?? system.subtitle);
    system.mapUnits = String(raw?.mapUnits || system.mapUnits);
    system.viewRadius = Math.max(1, Number(raw?.viewRadius) || system.viewRadius);
    system.sun = { ...system.sun, ...(raw?.sun || {}) };
    system.shell = { ...system.shell, ...(raw?.shell || {}) };
    system.groups = Array.isArray(raw?.groups) ? raw.groups.map((g) => createGroup(g)) : [];
    system.portals = Array.isArray(raw?.portals) ? raw.portals.map((p) => createPortal(p)) : [];
    system.bodies = Array.isArray(raw?.bodies) ? raw.bodies.map((b) => createBody(b)) : [];
    system.lore = normalizeLore(raw?.lore || {});
    system.schema = 'kosmos-kreator/v0.2';
    return system;
  }

  function setStatus(message) { $('statusText').textContent = message; }

  function downloadText(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFilename(name, ext) {
    const base = String(name || 'kosmos').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'kosmos';
    return `${base}.${ext}`;
  }

  function saveJson() {
    downloadText(safeFilename(state.system.name, 'json'), JSON.stringify(state.system, null, 2), 'application/json');
    setStatus('Saved Kosmos JSON.');
  }

  function exportSvg() {
    const clone = $('kosmosSvg').cloneNode(true);
    clone.setAttribute('xmlns', SVG_NS);
    clone.setAttribute('width', String(VIEW_W));
    clone.setAttribute('height', String(VIEW_H));
    clone.querySelectorAll('.body-hit, .portal-hit, .group-hit, .body-selected-ring').forEach((node) => node.remove());
    clone.querySelectorAll('.orbit-path.selected').forEach((node) => node.classList.remove('selected'));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
    downloadText(safeFilename(state.system.name, 'svg'), xml, 'image/svg+xml');
    setStatus('Exported current map state as SVG.');
  }

  function safeJsonForScript(value) {
    return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  }

  function exportInteractiveHtml() {
    const payload = safeJsonForScript(state.system);
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(state.system.name)} · Kosmos</title>
<style>
html,body{margin:0;height:100%;background:#03050d;color:#eef2ff;font-family:system-ui,sans-serif}#wrap{height:100%;position:relative;overflow:hidden}svg{width:100%;height:100%;display:block}.orbit{fill:none;stroke:#8a91b1;stroke-width:1.2;opacity:.5}.shell{fill:none;stroke:#76bdd2;stroke-width:2;opacity:.65;stroke-dasharray:7 7}.label{fill:#eef2ff;font-size:16px;text-anchor:middle;paint-order:stroke;stroke:#03050d;stroke-width:5px}.portalLabel{fill:#c9f6ff;font-size:13px;text-anchor:middle;paint-order:stroke;stroke:#03050d;stroke-width:4px}.title{fill:#f1f4ff;font-size:28px;font-weight:800;paint-order:stroke;stroke:#03050d;stroke-width:6px}.subtitle{fill:#aebbe3;font-size:14px;paint-order:stroke;stroke:#03050d;stroke-width:4px}.sun{fill:#ffd266;stroke:#fff2b3;stroke-width:2}.group{fill:#1e2e4b;stroke:#a9c7ff;stroke-width:2;cursor:pointer}.portal{stroke:#e8fbff;stroke-width:2;cursor:pointer}.back{opacity:.42;stroke-dasharray:3 2}.body{cursor:pointer}.controls{position:absolute;right:12px;top:12px;display:grid;gap:6px;background:#0b1020dd;border:1px solid #2b3048;border-radius:10px;padding:10px;max-width:220px}.controls strong{font-size:11px;letter-spacing:.1em;color:#9edff0}.controls button{background:#171d31;color:#eef2ff;border:1px solid #36405d;border-radius:7px;padding:7px;text-align:left}.popup{position:absolute;left:14px;bottom:14px;max-width:min(430px,calc(100% - 28px));background:#0b1020ee;border:1px solid #36405d;border-radius:12px;padding:13px;box-shadow:0 10px 30px #0008}.popup[hidden]{display:none}.popup h2{margin:0 28px 6px 0;font-size:18px}.popup p{margin:5px 0;color:#cbd3ee}.popup small{color:#8f98b6}.popup button.close{position:absolute;right:8px;top:8px}.popup a,.popup button.link{color:#9edff0;background:transparent;border:0;padding:4px 0;display:inline-block}.stars{fill:#03050d}
</style></head><body><div id="wrap"><svg id="map" viewBox="0 0 1200 800"></svg><div id="controls" class="controls"></div><div id="popup" class="popup" hidden><button class="close" id="closePopup">×</button><h2 id="popupTitle"></h2><p id="popupText"></p><small id="popupMeta"></small><div id="popupTarget"></div></div></div>
<script>
const S=${payload};
const W=1200,H=800,C={x:600,y:400},NS='http://www.w3.org/2000/svg';
const d=x=>Number(x)*Math.PI/180,n=x=>((Number(x)%360)+360)%360,c=(x,a,b)=>Math.min(b,Math.max(a,x));
const scale=()=>Math.min(W,H)*.43/Math.max(1,Number(S.viewRadius)||1);
const el=(t,a={})=>{const e=document.createElementNS(NS,t);Object.entries(a).forEach(([k,v])=>e.setAttribute(k,v));return e};
const polar=(r,t,i=0)=>{t=d(n(t));i=d(c(Number(i)||0,-90,90));const p=Number(r)||0,q=p*Math.cos(i),x=q*Math.sin(t),y=-q*Math.cos(t),z=p*Math.sin(i);return{x:C.x+x*scale(),y:C.y+y*scale(),z}};
const op=(b,ph)=>{const o=b.orbit||{},a=Math.max(.0001,Number(o.radius)||.0001),e=c(Number(o.eccentricity)||0,0,.94),bb=a*Math.sqrt(1-e*e),E=d(n(ph)-90);let x=a*(Math.cos(E)-e),y=bb*Math.sin(E),z=0,ar=d(Number(o.rotation)||0);[x,y]=[x*Math.cos(ar)-y*Math.sin(ar),x*Math.sin(ar)+y*Math.cos(ar)];const inc=d(c(Number(o.inclination)||0,-89,89));[y,z]=[y*Math.cos(inc)-z*Math.sin(inc),y*Math.sin(inc)+z*Math.cos(inc)];const nd=d(Number(o.node)||0);[x,y]=[x*Math.cos(nd)-y*Math.sin(nd),x*Math.sin(nd)+y*Math.cos(nd)];x+=Number(o.offsetX)||0;y+=Number(o.offsetY)||0;return{x:C.x+x*scale(),y:C.y+y*scale(),z}};
const path=b=>{let s='';for(let i=0;i<=180;i++){const p=op(b,i*2);s+=(i?'L':'M')+p.x.toFixed(2)+','+p.y.toFixed(2)+' '}return s+'Z'};
const memberCount=g=>(S.bodies||[]).filter(b=>b.groupId===g.id).length;
const hidden=b=>{const g=(S.groups||[]).find(x=>x.id===b.groupId);return !!g?.collapsed};
function txt(x,y,text,cls){const e=el('text',{x,y,class:cls});e.textContent=text;return e}
function showInfo(obj,kind){const lore=(S.lore||{})[obj.loreId]||{};document.getElementById('popupTitle').textContent=lore.name||obj.name;document.getElementById('popupText').textContent=lore.summary||lore.description||'No lore entry attached yet.';document.getElementById('popupMeta').textContent=[kind,obj.loreId?'Lore: '+obj.loreId:'',obj.sceneTarget?'Scene: '+obj.sceneTarget:''].filter(Boolean).join(' · ');const target=document.getElementById('popupTarget');target.innerHTML='';if(obj.sceneTarget){const a=document.createElement('a');a.textContent='Open '+obj.sceneTarget;a.href=/^https?:/.test(obj.sceneTarget)?obj.sceneTarget:'#'+obj.sceneTarget;target.appendChild(a)}document.getElementById('popup').hidden=false}
function render(){const m=document.getElementById('map');m.innerHTML='';m.append(el('rect',{width:W,height:H,class:'stars'}));m.append(txt(32,48,S.name,'title'));m.append(txt(34,72,S.subtitle||'','subtitle'));
if(S.shell?.show){const r=S.shell.radius*scale();m.append(el('circle',{cx:C.x,cy:C.y,r,class:'shell'}));m.append(txt(C.x,C.y-r+20,S.shell.label||'Crystal Shell','portalLabel'))}
(S.bodies||[]).forEach(b=>{if(hidden(b)||!b.showOrbit)return;m.append(el('path',{d:path(b),class:'orbit'}))});m.append(el('circle',{cx:C.x,cy:C.y,r:21,class:'sun'}));m.append(txt(C.x,C.y+52,S.sun?.name||'Sun','label'));
(S.bodies||[]).forEach(b=>{if(hidden(b))return;const p=op(b,b.orbit.phase),sz=c(Number(b.size)||42,8,240),g=el('g',{class:'body'});if(b.image)g.append(el('image',{href:b.image,x:p.x-sz/2,y:p.y-sz/2,width:sz,height:sz,preserveAspectRatio:'xMidYMid meet'}));else g.append(el('circle',{cx:p.x,cy:p.y,r:sz*.34,fill:'#7682b2',stroke:'#dbe3ff','stroke-width':2}));g.addEventListener('click',()=>showInfo(b,'body'));m.append(g);if(b.showLabel)m.append(txt(p.x,p.y+sz/2+Number(b.labelOffset||0),b.name,'label'))});
(S.groups||[]).forEach(g=>{if(!g.collapsed)return;const p=polar(g.anchor.radius,g.anchor.theta,g.anchor.inclination),sz=c(Number(g.size)||58,20,180),mk=el('circle',{cx:p.x,cy:p.y,r:sz/2,class:'group'});mk.addEventListener('click',()=>{if(g.interactive){g.collapsed=false;render();renderControls()}else showInfo(g,'group')});m.append(mk);m.append(txt(p.x,p.y+5,'×'+memberCount(g),'label'));m.append(txt(p.x,p.y+sz/2+22,g.name,'label'))});
if(S.shell?.showPortals)(S.portals||[]).forEach(p=>{const q=polar(S.shell.radius,p.theta,p.inclination),h=c(Number(p.size)||24,8,100)/2,pts=[q.x+','+(q.y-h),(q.x+h)+','+q.y,q.x+','+(q.y+h),(q.x-h)+','+q.y].join(' '),mk=el('polygon',{points:pts,class:'portal '+(q.z<0?'back':''),fill:p.type==='astral'?'#8ce8ff':p.type==='custom'?'#ffd37a':'#b179ff'});mk.addEventListener('click',()=>showInfo(p,'portal'));m.append(mk);if(p.showLabel)m.append(txt(q.x,q.y+h+Number(p.labelOffset||0),p.name+' · '+(p.inclination>=0?'+':'')+Math.round(p.inclination)+'°','portalLabel'))});}
function renderControls(){const box=document.getElementById('controls');box.innerHTML='';const groups=S.groups||[];if(!groups.length){box.hidden=true;return}box.hidden=false;const h=document.createElement('strong');h.textContent='MAP GROUPS';box.appendChild(h);groups.forEach(g=>{const b=document.createElement('button');b.textContent=(g.collapsed?'⊕ ':'⊖ ')+g.name+' · '+memberCount(g);b.onclick=()=>{g.collapsed=!g.collapsed;render();renderControls()};box.appendChild(b)})}
document.getElementById('closePopup').onclick=()=>document.getElementById('popup').hidden=true;render();renderControls();
</script></body></html>`;
    downloadText(safeFilename(state.system.name + '-interactive', 'html'), html, 'text/html');
    setStatus('Exported interactive HTML with current group states, lore hooks, and clickable portals.');
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function openJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state.system = sanitizeSystem(JSON.parse(String(reader.result)));
        state.selection = { kind: null, id: null };
        render();
        setStatus(`Opened ${file.name}.`);
      } catch (error) {
        console.error(error);
        setStatus('Could not read that Kosmos JSON file.');
        alert('That file is not valid Kosmos JSON.');
      }
    };
    reader.readAsText(file);
  }

  function openLoreFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = normalizeLore(JSON.parse(String(reader.result)));
        state.system.lore = { ...(state.system.lore || {}), ...incoming };
        setStatus(`Loaded ${Object.keys(incoming).length} lore entries from ${file.name}.`);
      } catch (error) {
        console.error(error);
        setStatus('Could not read that lore JSON file.');
        alert('That file is not valid JSON lore data.');
      }
    };
    reader.readAsText(file);
  }

  function fitBodies() {
    if (!state.system.bodies.length) return;
    let extent = 1;
    state.system.bodies.forEach((body) => {
      const a = Number(body.orbit.radius) || 0;
      const off = Math.hypot(Number(body.orbit.offsetX) || 0, Number(body.orbit.offsetY) || 0);
      extent = Math.max(extent, a * (1 + clamp(Number(body.orbit.eccentricity) || 0, 0, 0.94)) + off);
    });
    state.system.viewRadius = Math.ceil(extent * 1.15);
    render();
    setStatus('View fitted to all true body orbits.');
  }

  function fitShell() {
    state.system.viewRadius = Math.max(1, Math.ceil(Number(state.system.shell.radius || 1) * 1.08));
    render();
    setStatus('View fitted to the Crystal Shell.');
  }

  function wireNumber(id, kind, setter, options = {}) {
    $(id).addEventListener('input', (event) => {
      const value = Number(event.target.value);
      if (!Number.isFinite(value)) return;
      mutateSelected(kind, (item) => setter(item, options.normalize ? normDeg(value) : value));
    });
  }

  function wireText(id, kind, setter) {
    $(id).addEventListener('input', (event) => mutateSelected(kind, (item) => setter(item, event.target.value)));
  }

  function wireUi() {
    $('systemNameInput').addEventListener('input', (event) => { state.system.name = event.target.value; renderMap(); });
    $('systemSubtitleInput').addEventListener('input', (event) => { state.system.subtitle = event.target.value; renderMap(); });
    $('mapUnitsInput').addEventListener('input', (event) => { state.system.mapUnits = event.target.value; });
    $('viewRadiusInput').addEventListener('input', (event) => { const n = Number(event.target.value); if (Number.isFinite(n) && n > 0) { state.system.viewRadius = n; renderMap(); } });
    $('shellRadiusInput').addEventListener('input', (event) => { const n = Number(event.target.value); if (Number.isFinite(n) && n > 0) { state.system.shell.radius = n; renderMap(); } });
    $('shellTravelDaysInput').addEventListener('input', (event) => { const n = Number(event.target.value); if (Number.isFinite(n) && n >= 0) state.system.shell.travelDays = n; });
    $('shellLabelInput').addEventListener('input', (event) => { state.system.shell.label = event.target.value; renderMap(); });
    $('showShellInput').addEventListener('change', (event) => { state.system.shell.show = event.target.checked; renderMap(); });
    $('showPortalsInput').addEventListener('change', (event) => { state.system.shell.showPortals = event.target.checked; renderMap(); });

    $('newSystemBtn').addEventListener('click', () => {
      if (!confirm('Start a new Kosmos? Unsaved changes in this browser tab will be lost.')) return;
      state.system = createBlankSystem(); state.selection = { kind: null, id: null }; render(); setStatus('New Kosmos created.');
    });
    $('loadRealmspaceBtn').addEventListener('click', () => { state.system = realmspaceDemo(); state.selection = { kind: 'group', id: 'inner-realmspace' }; render(); setStatus('Realmspace v0.2 demo loaded.'); });
    $('openJsonBtn').addEventListener('click', () => $('openJsonInput').click());
    $('openJsonInput').addEventListener('change', (event) => { const file = event.target.files?.[0]; if (file) openJsonFile(file); event.target.value = ''; });
    $('openLoreBtn').addEventListener('click', () => $('openLoreInput').click());
    $('openLoreInput').addEventListener('change', (event) => { const file = event.target.files?.[0]; if (file) openLoreFile(file); event.target.value = ''; });
    $('saveJsonBtn').addEventListener('click', saveJson);
    $('exportSvgBtn').addEventListener('click', exportSvg);
    $('exportHtmlBtn').addEventListener('click', exportInteractiveHtml);
    $('fitViewBtn').addEventListener('click', fitBodies);
    $('fitShellBtn').addEventListener('click', fitShell);

    $('addBodyBtn').addEventListener('click', () => {
      const body = createBody({ name: `World ${state.system.bodies.length + 1}` });
      state.system.bodies.push(body); state.selection = { kind: 'body', id: body.id }; render(); setStatus(`${body.name} added.`);
    });
    $('deleteBodyBtn').addEventListener('click', () => {
      const body = selected('body'); if (!body || !confirm(`Delete ${body.name}?`)) return;
      state.system.bodies = state.system.bodies.filter((b) => b.id !== body.id); state.selection = { kind: null, id: null }; render(); setStatus(`${body.name} deleted.`);
    });
    $('addGroupBtn').addEventListener('click', () => {
      const group = createGroup({ name: `Group ${state.system.groups.length + 1}` });
      state.system.groups.push(group); state.selection = { kind: 'group', id: group.id }; render(); setStatus(`${group.name} added.`);
    });
    $('deleteGroupBtn').addEventListener('click', () => {
      const group = selected('group'); if (!group || !confirm(`Delete ${group.name}? Bodies will remain but become ungrouped.`)) return;
      state.system.bodies.forEach((body) => { if (body.groupId === group.id) body.groupId = ''; });
      state.system.groups = state.system.groups.filter((g) => g.id !== group.id); state.selection = { kind: null, id: null }; render(); setStatus(`${group.name} deleted.`);
    });
    $('addPortalBtn').addEventListener('click', () => {
      const portal = createPortal({ name: `Portal ${state.system.portals.length + 1}`, theta: state.system.portals.length * 55 });
      state.system.portals.push(portal); state.system.shell.showPortals = true; state.selection = { kind: 'portal', id: portal.id }; render(); setStatus(`${portal.name} added.`);
    });
    $('deletePortalBtn').addEventListener('click', () => {
      const portal = selected('portal'); if (!portal || !confirm(`Delete ${portal.name}?`)) return;
      state.system.portals = state.system.portals.filter((p) => p.id !== portal.id); state.selection = { kind: null, id: null }; render(); setStatus(`${portal.name} deleted.`);
    });

    wireText('bodyNameInput', 'body', (b, v) => { b.name = v; });
    wireNumber('bodySizeInput', 'body', (b, v) => { b.size = clamp(v, 8, 240); });
    wireNumber('labelOffsetInput', 'body', (b, v) => { b.labelOffset = clamp(v, 0, 160); });
    $('bodyGroupInput').addEventListener('change', (event) => mutateSelected('body', (b) => { b.groupId = event.target.value; }));
    wireNumber('radiusInput', 'body', (b, v) => { b.orbit.radius = Math.max(.1, v); });
    wireNumber('phaseInput', 'body', (b, v) => { b.orbit.phase = v; }, { normalize: true });
    wireNumber('eccentricityInput', 'body', (b, v) => { b.orbit.eccentricity = clamp(v, 0, .94); });
    wireNumber('rotationInput', 'body', (b, v) => { b.orbit.rotation = normDeg(v); });
    wireNumber('inclinationInput', 'body', (b, v) => { b.orbit.inclination = clamp(v, -89, 89); });
    wireNumber('nodeInput', 'body', (b, v) => { b.orbit.node = normDeg(v); });
    wireNumber('offsetXInput', 'body', (b, v) => { b.orbit.offsetX = v; });
    wireNumber('offsetYInput', 'body', (b, v) => { b.orbit.offsetY = v; });
    wireText('bodyLoreIdInput', 'body', (b, v) => { b.loreId = v; });
    wireText('bodySceneTargetInput', 'body', (b, v) => { b.sceneTarget = v; });
    $('showOrbitInput').addEventListener('change', (event) => mutateSelected('body', (b) => { b.showOrbit = event.target.checked; }));
    $('showLabelInput').addEventListener('change', (event) => mutateSelected('body', (b) => { b.showLabel = event.target.checked; }));

    $('chooseBodyImageBtn').addEventListener('click', () => $('bodyImageInput').click());
    $('clearBodyImageBtn').addEventListener('click', () => mutateSelected('body', (b) => { b.image = ''; }));
    $('bodyImageInput').addEventListener('change', (event) => {
      const file = event.target.files?.[0]; const body = selected('body'); if (!file || !body) return;
      const reader = new FileReader(); reader.onload = () => { body.image = String(reader.result || ''); render(); setStatus(`Image embedded for ${body.name}.`); }; reader.readAsDataURL(file); event.target.value = '';
    });

    wireText('groupNameInput', 'group', (g, v) => { g.name = v; });
    $('groupCollapsedInput').addEventListener('change', (event) => mutateSelected('group', (g) => { g.collapsed = event.target.checked; }));
    $('groupInteractiveInput').addEventListener('change', (event) => mutateSelected('group', (g) => { g.interactive = event.target.checked; }));
    wireNumber('groupRadiusInput', 'group', (g, v) => { g.anchor.radius = Math.max(0, v); });
    wireNumber('groupThetaInput', 'group', (g, v) => { g.anchor.theta = normDeg(v); });
    wireNumber('groupInclinationInput', 'group', (g, v) => { g.anchor.inclination = clamp(v, -90, 90); });
    wireNumber('groupSizeInput', 'group', (g, v) => { g.size = clamp(v, 20, 180); });
    wireText('groupLoreIdInput', 'group', (g, v) => { g.loreId = v; });
    wireText('groupSceneTargetInput', 'group', (g, v) => { g.sceneTarget = v; });

    wireText('portalNameInput', 'portal', (p, v) => { p.name = v; });
    $('portalTypeInput').addEventListener('change', (event) => mutateSelected('portal', (p) => { p.type = event.target.value; }));
    wireNumber('portalThetaInput', 'portal', (p, v) => { p.theta = normDeg(v); });
    wireNumber('portalInclinationInput', 'portal', (p, v) => { p.inclination = clamp(v, -90, 90); });
    wireNumber('portalSizeInput', 'portal', (p, v) => { p.size = clamp(v, 8, 100); });
    wireNumber('portalLabelOffsetInput', 'portal', (p, v) => { p.labelOffset = clamp(v, 0, 120); });
    wireText('portalLoreIdInput', 'portal', (p, v) => { p.loreId = v; });
    wireText('portalSceneTargetInput', 'portal', (p, v) => { p.sceneTarget = v; });
    $('portalShowLabelInput').addEventListener('change', (event) => mutateSelected('portal', (p) => { p.showLabel = event.target.checked; }));

    $('kosmosSvg').addEventListener('pointermove', onPointerMove);
    $('kosmosSvg').addEventListener('pointerup', onPointerUp);
    $('kosmosSvg').addEventListener('pointercancel', onPointerUp);
    $('kosmosSvg').addEventListener('pointerleave', (event) => { if (event.buttons === 0) onPointerUp(); });
    $('kosmosSvg').addEventListener('click', (event) => { if (event.target.id === 'kosmosSvg' || event.target.classList.contains('space-bg')) clearSelection(); });
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { state.draggingId = null; clearSelection(); } });
  }

  wireUi();
  state.system = realmspaceDemo();
  state.selection = { kind: 'group', id: 'inner-realmspace' };
  render();
})();
