# Kosmos.Kreator

A lightweight, no-build Spelljammer atlas editor for Wildspace systems, Crystal Spheres, local celestial neighborhoods, shell portals, lore popups, and drill-down scenes.

## v0.3.1 — Art + composable actions

The editor now has a **Preview** mode, so you can hide the authoring sidebars and use the atlas directly without exporting an Interactive HTML file first.

Artwork is no longer limited to ordinary orbiting bodies. Scene centers, bodies, collapsed groups, regions, POIs, and shell portals can all carry embedded artwork, and each scene can also carry an optional background image. Region art has its own opacity control, while symbols remain useful fallbacks for small features.

Interactions are now composable rather than mutually exclusive. A single object may expose any combination of:

- **ⓘ Lore** — open its lore entry
- **＋ / − Expand** — expand or collapse a target map group in place
- **↗ Enter** — open a linked atlas scene

The editor and interactive HTML export present these as separate controls. Older v0.3 `interaction` fields and older `sceneTarget` fields are migrated in memory to the new action model when JSON is opened.

## v0.3 — Atlas Scenes

The editor separates **cosmology**, **presentation**, and **interaction**. A body can remain at its true orbital coordinates while its group is collapsed for a particular map scale. A major object can open another scene, while a minor wreck or anchorage can simply open lore.

Current features include:

- multi-scene atlases with stable scene IDs
- browser back/deep links using `#scene=<id>`
- breadcrumb navigation
- scene links that replace the canvas instead of stacking popups
- lore popups for minor points of interest
- bodies, regions/clusters, points of interest, collapsible map groups, and shell portals
- Crystal Shell radius, travel-day label, visibility toggle, and **Fit shell**
- shell portals positioned by θ plus inclination / shell latitude
- front- and rear-hemisphere portal styling
- parent/local scene relationships without requiring strict click-through containment
- alias fields, demonstrated with `Selûne` and alias `Leira`
- shared-orbit regions and POIs, used by the Tears of Selûne and Rock of Bral
- a Toril neighborhood demo where Bral is directly clickable without first entering the Tears
- a Garden local scene containing its twelve moons
- simulation clock with revolution periods and rotation periods
- draggable animated bodies; dragging rewrites epoch phase rather than corrupting current simulation time
- static SVG snapshots at the current animation instant
- self-contained interactive HTML export with scenes, breadcrumbs, popups, collapsed groups, and animation
- v0.1/v0.2 JSON upgrade into a one-scene atlas
- separate lore JSON loading

No framework, package install, server, or build step is required.

## Run it

The published editor is available through GitHub Pages. For local development, serve the repository root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Scene model

A current file is an atlas containing scenes:

```json
{
  "schema": "kosmos-kreator/v0.3.1",
  "name": "Realmspace Atlas",
  "rootSceneId": "realmspace",
  "scenes": [
    {
      "id": "toril-neighborhood",
      "name": "Toril Neighborhood",
      "parentSceneId": "realmspace",
      "center": { "name": "Toril" },
      "bodies": [],
      "regions": [],
      "pois": [],
      "groups": [],
      "portals": []
    }
  ]
}
```

Interactive objects may now combine actions:

```json
{
  "loreId": "tears-of-selune",
  "actions": {
    "lore": { "enabled": true },
    "expand": { "enabled": true, "target": "tears-detail" },
    "scene": { "enabled": true, "target": "tears-local" }
  }
}
```

Containment does not force navigation. The Rock of Bral may be visually located inside the Tears of Selûne while remaining a direct scene destination from the Toril neighborhood.

## Motion

Bodies may store revolution and rotation periods:

```json
{
  "motion": {
    "orbitPeriodDays": 30,
    "orbitDirection": 1,
    "rotationPeriodHours": 720,
    "rotationDirection": 1,
    "spinSymbol": true
  }
}
```

A zero period means “do not animate until a period is supplied.” This is deliberate for bodies whose canon period has not yet been entered. Garden’s twelve moons are therefore a geometry/density test rather than an assertion of invented orbital periods.

The current globe-like rotation display is only a symbol/spin preview. A true textured rotating-world scene with latitude/longitude hotspots is intended as a later scene type.
