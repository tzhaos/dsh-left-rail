# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
