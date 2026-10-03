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

  const state = {
    system: createBlankSystem(),
    selectedId: null,
    draggingId: null,
  };

  function createBlankSystem() {
    return {
      schema: 'kosmos-kreator/v0.1',
      name: 'Untitled Kosmos',
      viewRadius: 500,
      sun: { name: 'Sun', size: 62 },
      bodies: [],
    };
  }

  function createBody(overrides = {}) {
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `body-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: 'New World',
      image: '',
      size: 42,
      labelOffset: 34,
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

  function realmspaceDemo() {
    return {
      schema: 'kosmos-kreator/v0.1',
      name: 'Realmspace',
      viewRadius: 3400,
      sun: { name: 'Sun', size: 64 },
      bodies: [
        createBody({ name: 'Anadia', size: 24, orbit: { radius: 50, phase: 10 } }),
        createBody({ name: 'Coliar', size: 29, orbit: { radius: 100, phase: 150, inclination: 3, node: 35 } }),
        createBody({ name: 'Toril', size: 35, orbit: { radius: 200, phase: 265, inclination: 0 } }),
        createBody({ name: 'Karpri', size: 34, orbit: { radius: 300, phase: 330, eccentricity: 0.08, rotation: 20, inclination: 9, node: 70 } }),
        createBody({ name: 'Chandos', size: 41, orbit: { radius: 400, phase: 195, eccentricity: 0.05, rotation: -12, inclination: 15, node: 110 } }),
        createBody({ name: 'Glyth', size: 42, orbit: { radius: 1000, phase: 315, eccentricity: 0.1, rotation: 12, inclination: 7, node: 20 } }),
        createBody({ name: 'Garden', size: 42, orbit: { radius: 1200, phase: 265, eccentricity: 0.03, rotation: 50, inclination: -6, node: 150 } }),
        createBody({ name: "H'catha", size: 38, orbit: { radius: 1600, phase: 95, eccentricity: 0.14, rotation: -15, inclination: 18, node: 40 } }),
      ],
    };
  }

  function selectedBody() {
    return state.system.bodies.find((body) => body.id === state.selectedId) || null;
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

    // User convention: 0° is straight up before orientation transforms.
    const E = deg(normDeg(phaseDeg) - 90);
    let x = a * (Math.cos(E) - e);
    let y = b * Math.sin(E);
    let z = 0;

    // Rotate the ellipse within its own plane.
    const arg = deg(Number(orbit.rotation) || 0);
    [x, y] = [x * Math.cos(arg) - y * Math.sin(arg), x * Math.sin(arg) + y * Math.cos(arg)];

    // Tilt the plane around its local X axis.
    const inc = deg(clamp(Number(orbit.inclination) || 0, -89, 89));
    [y, z] = [y * Math.cos(inc) - z * Math.sin(inc), y * Math.sin(inc) + z * Math.cos(inc)];

    // Rotate the line of nodes around the system normal.
    const node = deg(Number(orbit.node) || 0);
    [x, y] = [x * Math.cos(node) - y * Math.sin(node), x * Math.sin(node) + y * Math.cos(node)];

    x += Number(orbit.offsetX) || 0;
    y += Number(orbit.offsetY) || 0;

    const scale = mapScale();
    return {
      x: CENTER.x + x * scale,
      y: CENTER.y + y * scale,
      z,
      modelX: x,
      modelY: y,
    };
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

  function render() {
    renderSystemFields();
    renderBodyList();
    renderInspector();
    renderMap();
  }

  function renderSystemFields() {
    $('systemNameInput').value = state.system.name;
    $('viewRadiusInput').value = state.system.viewRadius;
  }

  function renderBodyList() {
    const list = $('bodyList');
    clear(list);
    if (!state.system.bodies.length) {
      const empty = document.createElement('p');
      empty.className = 'field-note block';
      empty.textContent = 'No orbiting bodies yet.';
      list.appendChild(empty);
      return;
    }

    state.system.bodies.forEach((body) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `body-row${body.id === state.selectedId ? ' selected' : ''}`;
      row.dataset.id = body.id;

      let thumb;
      if (body.image) {
        thumb = document.createElement('img');
        thumb.className = 'body-thumb';
        thumb.src = body.image;
        thumb.alt = '';
      } else {
        thumb = document.createElement('span');
        thumb.className = 'body-thumb body-thumb-fallback';
        thumb.textContent = '●';
      }
      const name = document.createElement('span');
      name.textContent = body.name;
      const distance = document.createElement('span');
      distance.className = 'body-distance';
      distance.textContent = `${round(body.orbit.radius, 1)}`;

      row.append(thumb, name, distance);
      row.addEventListener('click', () => selectBody(body.id));
      list.appendChild(row);
    });
  }

  function renderInspector() {
    const body = selectedBody();
    $('emptyInspector').hidden = Boolean(body);
    $('bodyInspector').hidden = !body;
    $('selectionReadout').textContent = body ? `${body.name} · R ${round(body.orbit.radius, 2)} · θ ${round(normDeg(body.orbit.phase), 1)}°` : 'No body selected';
    if (!body) return;

    $('bodyNameInput').value = body.name;
    $('bodySizeInput').value = body.size;
    $('labelOffsetInput').value = body.labelOffset;
    $('radiusInput').value = body.orbit.radius;
    $('phaseInput').value = round(normDeg(body.orbit.phase), 3);
    $('eccentricityInput').value = body.orbit.eccentricity;
    $('rotationInput').value = body.orbit.rotation;
    $('inclinationInput').value = body.orbit.inclination;
    $('nodeInput').value = body.orbit.node;
    $('offsetXInput').value = body.orbit.offsetX;
    $('offsetYInput').value = body.orbit.offsetY;
    $('showOrbitInput').checked = body.showOrbit;
    $('showLabelInput').checked = body.showLabel;
  }

  function renderMap() {
    const orbitLayer = $('orbitLayer');
    const sunLayer = $('sunLayer');
    const bodyLayer = $('bodyLayer');
    const labelLayer = $('labelLayer');
    clear(orbitLayer);
    clear(sunLayer);
    clear(bodyLayer);
    clear(labelLayer);

    state.system.bodies.forEach((body) => {
      if (!body.showOrbit) return;
      const path = svgEl('path', {
        d: orbitPathData(body),
        class: `orbit-path${body.id === state.selectedId ? ' selected' : ''}`,
        'data-id': body.id,
      });
      path.addEventListener('click', () => selectBody(body.id));
      orbitLayer.appendChild(path);
    });

    const glow = svgEl('circle', { cx: CENTER.x, cy: CENTER.y, r: 58, fill: 'url(#sunGlow)', filter: 'url(#softGlow)' });
    const core = svgEl('circle', { cx: CENTER.x, cy: CENTER.y, r: 21, class: 'sun-core' });
    const sunLabel = svgEl('text', { x: CENTER.x, y: CENTER.y + 52, class: 'sun-label' });
    sunLabel.textContent = state.system.sun?.name || 'Sun';
    sunLayer.append(glow, core, sunLabel);

    state.system.bodies.forEach((body) => {
      const p = orbitPoint(body, body.orbit.phase);
      const size = clamp(Number(body.size) || 42, 8, 240);
      const group = svgEl('g', { 'data-id': body.id, tabindex: '0', role: 'button', 'aria-label': body.name });

      if (body.image) {
        const image = svgEl('image', {
          href: body.image,
          x: p.x - size / 2,
          y: p.y - size / 2,
          width: size,
          height: size,
          preserveAspectRatio: 'xMidYMid meet',
          'pointer-events': 'none',
        });
        group.appendChild(image);
      } else {
        group.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: size * 0.34, class: 'body-fallback', 'pointer-events': 'none' }));
      }

      if (body.id === state.selectedId) {
        group.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: size * 0.58 + 5, class: 'body-selected-ring' }));
      }

      const hit = svgEl('circle', { cx: p.x, cy: p.y, r: Math.max(size * 0.62, 18), class: 'body-hit', 'data-id': body.id });
      hit.addEventListener('pointerdown', onBodyPointerDown);
      hit.addEventListener('click', (event) => { event.stopPropagation(); selectBody(body.id); });
      group.appendChild(hit);
      bodyLayer.appendChild(group);

      if (body.showLabel) {
        const label = svgEl('text', { x: p.x, y: p.y + size / 2 + Number(body.labelOffset || 0), class: 'body-label' });
        label.textContent = body.name;
        labelLayer.appendChild(label);
      }
    });
  }

  function selectBody(id) {
    state.selectedId = id;
    render();
  }

  function mutateSelected(fn) {
    const body = selectedBody();
    if (!body) return;
    fn(body);
    renderBodyList();
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
      if (d2 < bestDistance) {
        bestDistance = d2;
        bestPhase = phase;
      }
    }
    const step = 360 / coarse;
    for (let delta = -step; delta <= step; delta += step / 20) {
      const phase = bestPhase + delta;
      const p = orbitPoint(body, phase);
      const d2 = (p.x - sx) ** 2 + (p.y - sy) ** 2;
      if (d2 < bestDistance) {
        bestDistance = d2;
        bestPhase = phase;
      }
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
    const id = event.currentTarget.dataset.id;
    state.draggingId = id;
    state.selectedId = id;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    renderInspector();
    renderBodyList();
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

  function onPointerUp() {
    state.draggingId = null;
  }

  function sanitizeSystem(raw) {
    const system = createBlankSystem();
    system.name = String(raw?.name || system.name);
    system.viewRadius = Math.max(1, Number(raw?.viewRadius) || system.viewRadius);
    system.sun = { ...system.sun, ...(raw?.sun || {}) };
    system.bodies = Array.isArray(raw?.bodies) ? raw.bodies.map((body) => createBody(body)) : [];
    return system;
  }

  function setStatus(message) {
    $('statusText').textContent = message;
  }

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
    const payload = JSON.stringify(state.system, null, 2);
    downloadText(safeFilename(state.system.name, 'json'), payload, 'application/json');
    setStatus('Saved Kosmos JSON.');
  }

  function exportSvg() {
    const clone = $('kosmosSvg').cloneNode(true);
    clone.setAttribute('xmlns', SVG_NS);
    clone.setAttribute('width', String(VIEW_W));
    clone.setAttribute('height', String(VIEW_H));
    clone.querySelectorAll('.body-hit, .body-selected-ring').forEach((node) => node.remove());
    clone.querySelectorAll('.orbit-path.selected').forEach((node) => node.classList.remove('selected'));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
    downloadText(safeFilename(state.system.name, 'svg'), xml, 'image/svg+xml');
    setStatus('Exported SVG map.');
  }

  function openJsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        state.system = sanitizeSystem(raw);
        state.selectedId = state.system.bodies[0]?.id || null;
        render();
        setStatus(`Opened ${file.name}.`);
      } catch (error) {
        console.error(error);
        setStatus('Could not read that JSON file.');
        alert('That file is not valid Kosmos JSON.');
      }
    };
    reader.readAsText(file);
  }

  function fitBodies() {
    if (!state.system.bodies.length) return;
    let extent = 1;
    for (const body of state.system.bodies) {
      const a = Number(body.orbit.radius) || 0;
      const off = Math.hypot(Number(body.orbit.offsetX) || 0, Number(body.orbit.offsetY) || 0);
      extent = Math.max(extent, a * (1 + clamp(Number(body.orbit.eccentricity) || 0, 0, 0.94)) + off);
    }
    state.system.viewRadius = Math.ceil(extent * 1.15);
    render();
    setStatus('View fitted to current bodies.');
  }

  function wireNumber(id, setter, options = {}) {
    $(id).addEventListener('input', (event) => {
      const value = Number(event.target.value);
      if (!Number.isFinite(value)) return;
      mutateSelected((body) => setter(body, options.normalize ? normDeg(value) : value));
    });
  }

  function wireUi() {
    $('systemNameInput').addEventListener('input', (event) => {
      state.system.name = event.target.value;
      setStatus('System renamed.');
    });
    $('viewRadiusInput').addEventListener('input', (event) => {
      const n = Number(event.target.value);
      if (!Number.isFinite(n) || n <= 0) return;
      state.system.viewRadius = n;
      renderMap();
    });

    $('newSystemBtn').addEventListener('click', () => {
      if (!confirm('Start a new Kosmos? Unsaved changes in this browser tab will be lost.')) return;
      state.system = createBlankSystem();
      state.selectedId = null;
      render();
      setStatus('New Kosmos created.');
    });
    $('loadRealmspaceBtn').addEventListener('click', () => {
      state.system = realmspaceDemo();
      state.selectedId = state.system.bodies[0]?.id || null;
      render();
      setStatus('Realmspace demo loaded.');
    });
    $('openJsonBtn').addEventListener('click', () => $('openJsonInput').click());
    $('openJsonInput').addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) openJsonFile(file);
      event.target.value = '';
    });
    $('saveJsonBtn').addEventListener('click', saveJson);
    $('exportSvgBtn').addEventListener('click', exportSvg);
    $('fitViewBtn').addEventListener('click', fitBodies);
    $('resetViewBtn').addEventListener('click', () => {
      state.system.viewRadius = 500;
      render();
      setStatus('View radius reset to 500.');
    });

    $('addBodyBtn').addEventListener('click', () => {
      const body = createBody({ name: `World ${state.system.bodies.length + 1}` });
      state.system.bodies.push(body);
      state.selectedId = body.id;
      if (body.orbit.radius > state.system.viewRadius) fitBodies();
      else render();
      setStatus(`${body.name} added.`);
    });
    $('deleteBodyBtn').addEventListener('click', () => {
      const body = selectedBody();
      if (!body || !confirm(`Delete ${body.name}?`)) return;
      state.system.bodies = state.system.bodies.filter((b) => b.id !== body.id);
      state.selectedId = state.system.bodies[0]?.id || null;
      render();
      setStatus(`${body.name} deleted.`);
    });

    $('bodyNameInput').addEventListener('input', (event) => mutateSelected((body) => { body.name = event.target.value; }));
    wireNumber('bodySizeInput', (body, v) => { body.size = clamp(v, 8, 240); });
    wireNumber('labelOffsetInput', (body, v) => { body.labelOffset = clamp(v, 0, 160); });
    wireNumber('radiusInput', (body, v) => { body.orbit.radius = Math.max(.1, v); });
    wireNumber('phaseInput', (body, v) => { body.orbit.phase = v; }, { normalize: true });
    wireNumber('eccentricityInput', (body, v) => { body.orbit.eccentricity = clamp(v, 0, .94); });
    wireNumber('rotationInput', (body, v) => { body.orbit.rotation = normDeg(v); });
    wireNumber('inclinationInput', (body, v) => { body.orbit.inclination = clamp(v, -89, 89); });
    wireNumber('nodeInput', (body, v) => { body.orbit.node = normDeg(v); });
    wireNumber('offsetXInput', (body, v) => { body.orbit.offsetX = v; });
    wireNumber('offsetYInput', (body, v) => { body.orbit.offsetY = v; });

    $('showOrbitInput').addEventListener('change', (event) => mutateSelected((body) => { body.showOrbit = event.target.checked; }));
    $('showLabelInput').addEventListener('change', (event) => mutateSelected((body) => { body.showLabel = event.target.checked; }));

    $('chooseBodyImageBtn').addEventListener('click', () => $('bodyImageInput').click());
    $('clearBodyImageBtn').addEventListener('click', () => mutateSelected((body) => { body.image = ''; }));
    $('bodyImageInput').addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      const body = selectedBody();
      if (!file || !body) return;
      const reader = new FileReader();
      reader.onload = () => {
        body.image = String(reader.result || '');
        render();
        setStatus(`Image embedded for ${body.name}.`);
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    });

    $('kosmosSvg').addEventListener('pointermove', onPointerMove);
    $('kosmosSvg').addEventListener('pointerup', onPointerUp);
    $('kosmosSvg').addEventListener('pointercancel', onPointerUp);
    $('kosmosSvg').addEventListener('pointerleave', (event) => { if (event.buttons === 0) onPointerUp(); });
    $('kosmosSvg').addEventListener('click', (event) => {
      if (event.target.id === 'kosmosSvg' || event.target.classList.contains('space-bg')) {
        state.selectedId = null;
        render();
      }
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        state.draggingId = null;
        state.selectedId = null;
        render();
      }
    });
  }

  wireUi();
  state.system = realmspaceDemo();
  state.selectedId = state.system.bodies[2]?.id || state.system.bodies[0]?.id || null;
  render();
})();
