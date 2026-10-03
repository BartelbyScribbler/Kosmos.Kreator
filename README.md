# Kosmos.Kreator

A browser-based Wildspace / Crystal Sphere interior cartographer for Spelljammer-style cosmologies.

The app is intentionally static and dependency-free: open `index.html`, or use the GitHub Pages deployment.

## v0.2

Kosmos.Kreator now separates **cosmology**, **cartographic presentation**, and **interactive atlas behavior**.

- 3D orbital geometry projected into a 2D SVG map
- Semi-major radius, phase, eccentricity, ellipse rotation, inclination, node, and free orbit offset
- Crystal Shell radius, travel-distance label, and show/hide controls
- Shell portals positioned by **theta plus inclination**, so gates can live above or below the normal orbital plane
- Collapsible map groups for keeping inner systems readable at outer-system scale
- Static SVG export preserves the current collapsed/expanded state
- Interactive HTML export starts from the current map state and lets readers unfold clickable groups
- Bodies, groups, and portals can carry `loreId` and `sceneTarget` hooks for a larger nested atlas
- External lore JSON can be loaded and merged into the current Kosmos
- v0.1 JSON remains loadable and is upgraded in memory to the v0.2 schema

## Coordinate conventions

### Orbits

- `phase = 0°` points straight up on the map before orbit transforms
- `90°` points right
- `180°` points down
- `270°` points left
- `inclination` tilts the orbital plane
- `node` controls the direction of that tilt

### Crystal Shell portals

A portal is a point on a sphere, not an orbit.

- `theta` is longitude around the normal orbital plane using the same map convention
- `inclination = 0°` lies on the normal orbital plane / visible shell rim
- positive inclination lies on the upper hemisphere
- negative inclination lies on the lower hemisphere
- `+90°` and `-90°` are the poles

The top-down projection naturally moves high-inclination portals inward from the rim. Lower-hemisphere portals render faded/dashed so the map still communicates depth.

## Map groups

Bodies may reference a `groupId`. A group owns only presentation state; it does **not** change the bodies' real orbital coordinates.

When a group is collapsed, member bodies and their orbit lines are hidden and replaced by one marker at the group's configured anchor. Expanding restores the true geometry.

This is useful for cases such as Realmspace, where the inner planets can collapse to one central marker so the map can retain a sane scale for Glyth, Garden, H'catha, and the Crystal Shell.

## Lore and nested atlas hooks

Load a lore JSON file with **Load lore**. Kosmos.Kreator accepts:

- a keyed object
- `{ "lore": { ... } }`
- an `entries` array
- a `locations` array

Bodies, groups, and portals can reference entries with `loreId` and can point toward another map/scene or URL with `sceneTarget`.

The interactive HTML exporter already uses lore entries for popups and preserves `sceneTarget` values. A future atlas router can use those targets to move between a flow map, a Kosmos scene, a planetary neighborhood, and deeper location maps without changing the underlying Kosmos files.

## Realmspace demo

The built-in Realmspace example demonstrates:

- a 32-day Crystal Shell at radius 3200
- H'catha at radius 1600, corresponding to the 16-day reference scale
- an initially collapsed Inner Worlds group
- one upper-hemisphere and one lower-hemisphere Phlogiston portal

`examples/realmspace.json` contains the same structure as editable data.
