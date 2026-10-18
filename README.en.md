# dsh-left-rail

[简体中文](README.md) | English

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web client plugin that adds a
Codex-style icon rail left of the existing sidebar: **Conversations / Automation / Plugins / Settings**.

## Why

DSH puts plugins and automation tasks in wide text rows at the top of the sidebar. Codex uses a narrow
persistent icon rail and lets the sidebar hold content. This plugin moves those entries into the rail.

## Behaviour

- reserves a 46px rail at the far left and shifts `#root` right
- icon order: Conversations, Plugins, Automation, Settings
- the conversation entry uses a house/home glyph (the existing DSH order)
- Conversations returns to the Conversation main panel
- Plugins/Automation call `ctx.layout.selectPanel()` when the panel is installed
- unavailable panels are disabled with an explanatory tooltip
- Settings clicks the host's existing settings control
- theme tokens, hover and focus states match the host

## Implementation

1. injects CSS that shifts `#root` by 46px and renders the fixed rail;
2. reads `ctx.layout.panelInfo` for the active panel;
3. checks `ctx.layout.hasMainPanel()` before enabling Plugins/Automation;
4. calls `ctx.layout.selectPanel()` on click;
5. finds the host's `button[aria-label="设置"]` / `"Settings"` for Settings.

It does not replace the DSH sidebar or take over host routing.

## Install

```text
plugin_manager(action="install_bundle", target="<monorepo>/packages/dsh-left-rail")
```

Or install the whole monorepo:

```powershell
git clone --recurse-submodules https://github.com/tzhaos/dsh-plugins.git
cd dsh-plugins
node scripts/install-all.mjs
```

Fully quit and relaunch DSH after installing.

## Known limitations

- Automation requires a registered `schedules` main panel; otherwise the icon is disabled
- Settings depends on the host settings button's aria-label
- the rail always occupies 46px, reducing space on narrow screens
- the host sidebar's collapse behaviour is unchanged

## Development and tests

```sh
node scripts/check.mjs
```

The zero-dependency suite covers manifest/patch/locale/icon, entry order, panel switching, disabled
states, active highlighting and the settings button — 16 checks.

## License

[MIT](LICENSE)
