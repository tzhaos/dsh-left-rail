# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.4] - 2026-10-19

### Fixed

- Hide the host new-session button when the collapsed sidebar parks it in the titlebar row, removing
  the extra circle-plus between the rail toggle and the App menu.
- Match the rail-owned toggle's width to the 14px Back/Forward controls so the three buttons read as
  one evenly sized group.

### Verified

- `node scripts/check.mjs`: 19 checks green.

## [1.7.3] - 2026-10-19

### Fixed

- Force cloned host SVG icons to a fixed 18px box. The host panel glyphs change between 16px and 18px
  when the sidebar expands/collapses; cloning them made the rail icons grow and shrink.

### Verified

- `node scripts/check.mjs`: 18 checks green.

## [1.7.2] - 2026-10-19

### Fixed

- Remove the oversized top padding on the icon rail; icons now start directly below the titlebar
  instead of leaving a large empty gap.

### Verified

- `node scripts/check.mjs`: 17 checks green.

## [1.7.1] - 2026-10-19

### Fixed

- Match the host toggle's actual label (`收起侧边栏`) when hiding it; previously the regex missed it
  and two toggles were rendered.
- Place the rail-owned toggle inside the 48px leading titlebar area, before the native App/Edit menu
  bar, so nothing overlaps the menu.

### Verified

- `node scripts/check.mjs`: 17 checks green.

## [1.7.0] - 2026-10-19

### Changed

- Render a sidebar toggle immediately right of the titlebar Back/Forward arrows and hide the host
  titlebar toggle, so the top row reads `[<] [>] [toggle] App Edit` without overlap.

### Verified

- `node scripts/check.mjs`: 17 checks green.

## [1.6.1] - 2026-10-19

### Fixed

- Keep the icon component's hook order stable when a rail item becomes active. Switching to the
  Plugins panel no longer throws a React hook-count error and unmounts the whole rail.

### Verified

- `node scripts/check.mjs`: 16 checks green.

## [1.6.0] - 2026-10-19

### Changed

- Reserve the rail's top row for Back/Forward and remove the rail's hard divider, so the arrows,
  sidebar toggle and menu controls read as one top region.

### Verified

- `node scripts/check.mjs`: 15 checks green.

## [1.5.0] - 2026-10-19

### Changed

- Hide the native sidebar rows for Plugins and Automation, whose entries now live in the rail.
  Rows are re-hidden after sidebar re-renders and restored on unload.

### Verified

- `node scripts/check.mjs`: 15 checks green.

## [1.4.0] - 2026-10-19

### Changed

- The active rail item now renders a solid filled glyph; inactive items keep the host's original
  outline icon.

### Verified

- `node scripts/check.mjs`: 14 checks green.

## [1.3.0] - 2026-10-19

### Added

- Clicking the rail settings icon opens an account/settings popover with the host avatar/email,
  Settings, Feedback and Log out entries. Account and actions are read from the host DOM when present.

### Verified

- `node scripts/check.mjs`: 13 checks green.

## [1.2.0] - 2026-10-19

### Changed

- The conversation rail entry now uses a home/house glyph.
- The rail is 64px wide and reserves the top row for the window's Back/Forward controls, so the
  sidebar toggle and menu controls sit to their right in the same top region.

### Verified

- `node scripts/check.mjs`: 12 checks green.

## [1.1.0] - 2026-10-19

### Changed

- Plugins now precede Automation in the rail, matching DSH's existing panel order.
- Plugins, Automation and Settings reuse the Host's original rendered SVG glyphs instead of custom
  drawings.
- Hover tooltips now flip and clamp at the viewport edges: left-edge icons open to the right, and
  vertical positions stay inside the window.

### Verified

- `node scripts/check.mjs`: 12 checks green.

## [1.0.0] - 2026-10-19

### Added

- A 46px left rail with Conversations, Automation, Plugins and Settings entries.
- Panel switching through `ctx.layout.selectPanel()`, with unavailable panels disabled.
- Active-panel highlighting and a host-settings shortcut.

### Verified

- `node scripts/check.mjs`: 12 checks green.
