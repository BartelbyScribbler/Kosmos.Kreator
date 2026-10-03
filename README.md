# Kosmos.Kreator

A lightweight, no-build Wildspace / Crystal Sphere interior cartographer for creating ordinary and gloriously non-Keplerian Spelljammer systems.

## v0.1 prototype

The first working version is a static HTML + SVG app. It currently supports:

- an interactive top-down Kosmos map centered on a Sun
- orbiting bodies with uploaded PNG/JPEG/WebP/GIF/SVG artwork
- semi-major radius / distance from the Sun
- orbital phase using the map convention **0° = up, 90° = right, 180° = down, 270° = left**
- eccentricity
- ellipse rotation
- orbital inclination and line-of-nodes direction
- deliberately non-physical X/Y orbit offsets for strange Kosmoi
- direct dragging of a body along its projected orbit to change phase
- show/hide orbit and labels
- save/open the full system as JSON
- SVG export with embedded body images
- a built-in Realmspace-shaped demo dataset plus `examples/realmspace.json`

No framework, package install, server, or build step is required.

## Run it

Open `index.html` in a modern browser. For normal development, a tiny local static server is recommended so the project behaves the same way it will on GitHub Pages:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

Because all runtime code is client-side, the project can also be published directly with GitHub Pages from the repository root.

## Data model

A body stores its display settings and orbital parameters independently:

```json
{
  "name": "Toril",
  "size": 35,
  "orbit": {
    "radius": 200,
    "phase": 265,
    "eccentricity": 0,
    "rotation": 0,
    "inclination": 0,
    "node": 0,
    "offsetX": 0,
    "offsetY": 0
  }
}
```

Orbit geometry is generated in 3D and then projected onto the 2D SVG map. That keeps a genuinely eccentric orbit distinct from a circular orbit that merely *looks* elliptical because its orbital plane is inclined.

## Intended next steps

Once the core editor is pleasant to use, likely additions include parent bodies/moons, belts and arcs, free paths, depth styling for inclined orbits, map themes, travel-distance tools, time/phase animation, and a more general free-focus / impossible-orbit mode.
