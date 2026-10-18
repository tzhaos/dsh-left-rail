/**
 * Zero-dependency verification for dsh-left-rail.
 *
 * Run with `node scripts/check.mjs`. The suite mounts the overlay through a
 * miniature React runtime and drives a fake layout/settings environment.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8')
const manifest = JSON.parse(read('package.json'))
const clientSource = read('client.js')

let checks = 0

async function check(name, body) {
  try {
    await body()
    checks += 1
    console.log('ok ' + name)
  } catch (error) {
    console.error('FAIL ' + name)
    console.error('     ' + (error?.message ?? error))
    process.exitCode = 1
  }
}

function translator(dictionary) {
  return (key, params = {}) => (dictionary[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''))
}

function findAll(root, predicate) {
  const found = []
  const walk = (node) => {
    if (node === null || node === undefined || typeof node !== 'object') return
    if (Array.isArray(node)) { for (const child of node) walk(child); return }
    if (predicate(node)) found.push(node)
    walk(node.children)
  }
  walk(root)
  return found
}

function scenario(options = {}) {
  const listeners = new Map()
  const selected = []
  const panelListeners = new Set()
  let activePanel = options.activePanel ?? null
  const has = new Set(options.panels ?? ['plugins', 'schedules'])
  const panelInfo = {
    getSnapshot: () => ({ activePanelId: activePanel }),
    subscribe(listener) {
      panelListeners.add(listener)
      return () => panelListeners.delete(listener)
    },
  }
  const setActive = (id) => {
    activePanel = id
    for (const listener of panelListeners) listener()
  }
  const layout = {
    panelInfo,
    hasMainPanel: (id) => has.has(id),
    selectPanel(id) {
      selected.push(id)
      setActive(id)
    },
  }
  const settingsClicks = []
  const settings = {
    getAttribute(name) { return name === 'aria-label' ? '设置' : null },
    click() { settingsClicks.push(true) },
  }
  const panelButtons = ['插件', '自动化任务'].map((label) => ({
    hidden: false,
    getAttribute(name) { return name === 'aria-label' ? label : null },
    setAttribute(name) { if (name === 'data-dshlr-hidden') this.hidden = true },
    removeAttribute(name) { if (name === 'data-dshlr-hidden') this.hidden = false },
  }))
  const document = {
    addEventListener(type, handler) { listeners.set(type, handler) },
    removeEventListener(type, handler) { if (listeners.get(type) === handler) listeners.delete(type) },
    createElement: () => ({ dataset: {}, textContent: '', remove() {} }),
    head: { appendChild() {} },
    querySelectorAll: (selector) => selector === 'button[aria-label]' ? [settings, ...panelButtons] : [],
  }
  const registrations = []
  let locale
  let loaded
  const sandbox = {
    window: { __ModuleLoader__: { load(definition) { loaded = definition } } },
    document,
    console,
  }
  vm.runInNewContext(clientSource, sandbox, { filename: 'client.js' })
  const plugin = loaded.factory((id) => {
    if (id === 'react') {
      const hooks = []
      const state = []
      let cursor = 0
      return {
        createElement(type, props, ...children) {
          if (typeof type === 'function') return type({ ...props, children: children.length === 1 ? children[0] : children })
          const element = { type, props: { ...props, children: children.length === 1 ? children[0] : children } }
          element.children = children.length === 1 ? children[0] : children
          return element
        },
        useRef(initial) { return { current: initial } },
        useState(initial) {
          const index = cursor++
          if (!(index in state)) state[index] = initial
          return [state[index], (next) => { state[index] = typeof next === 'function' ? next(state[index]) : next }]
        },
        useEffect(effect) { effect() },
      }
    }
    throw new Error('unexpected require ' + id)
  })
  const ctx = {
    get(name) {
      if (name === 'layout') return layout
      return undefined
    },
    effect(factory) { factory(); return () => {} },
    locale: { register(ns, dicts) { locale = { ns, dicts }; return () => {} } },
    slots: { register(options, component) { registrations.push({ options, component }); return () => {} } },
  }
  plugin.apply(ctx)
  const registration = registrations[0]
  const t = translator(locale.dicts.zh)
  const injected = registration.options.inject()
  const render = () => registration.component({ ...injected, t })
  return { selected, setActive, settingsClicks, render, registration, injected, panelButtons }
}

function buttons(tree) {
  return findAll(tree, (element) => element.type === 'button')
}

// Static contract
await check('manifest declares a DSH bundle and web client half', () => {
  assert.equal(manifest.name, 'dsh-left-rail')
  assert.equal(manifest.version, '1.6.1')
  assert.equal(manifest.license, 'MIT')
  assert.equal(manifest.main, 'index.js')
  assert.equal(manifest.exports['./client'], './client.js')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert(manifest.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-layout'))
  assert.equal(manifest.scripts.check, 'node scripts/check.mjs')
})

await check('all manifest files exist on disk', () => {
  for (const relative of [
    manifest.main, 'client.js', manifest.dsh.bundle.patch,
    'locale/en.json', 'locale/zh.json', 'icon.svg', 'README.md', 'README.en.md',
    'CHANGELOG.md', 'LICENSE',
  ]) assert(fs.existsSync(path.join(ROOT, relative)), relative + ' exists')
})

await check('bundle patch inserts exactly one left-rail row', () => {
  const patch = read('cordis.patch.yml')
  assert(patch.includes('- insert:'))
  assert(patch.includes('id: left-rail'))
  assert(patch.includes("name: 'dsh-left-rail'"))
  assert.equal((patch.match(/- insert:/g) ?? []).length, 1)
})

await check('client only requires the frozen React module', () => {
  const requires = [...clientSource.matchAll(/require\('([^']+)'\)/g)].map((match) => match[1])
  assert.deepEqual(requires, ['react'])
})

await check('locale files carry title and description', () => {
  for (const locale of ['zh', 'en']) {
    const value = JSON.parse(read('locale/' + locale + '.json'))
    assert.equal(typeof value.meta.title, 'string')
    assert.equal(typeof value.meta.description, 'string')
  }
})

await check('icon is a valid accent SVG', () => {
  const icon = read('icon.svg')
  assert(icon.includes('<svg'))
  assert(icon.includes('#4D6BFE'))
})

// Behaviour
await check('rail exposes chat, automation, plugins and settings buttons', () => {
  const applied = scenario()
  const labels = buttons(applied.render()).map((button) => button.props['data-dshlr-button'])
  assert.deepEqual(labels, ['chat', 'plugins', 'automation', 'settings'])
})

await check('chat button selects the conversation panel', () => {
  const applied = scenario()
  buttons(applied.render()).find((button) => button.props['data-dshlr-button'] === 'chat').props.onClick()
  assert.deepEqual(applied.selected, [null])
})

await check('plugins button selects the built-in plugins panel', () => {
  const applied = scenario()
  buttons(applied.render()).find((button) => button.props['data-dshlr-button'] === 'plugins').props.onClick()
  assert.deepEqual(applied.selected, ['plugins'])
})

await check('unavailable automation panel is disabled', () => {
  const applied = scenario({ panels: ['plugins'] })
  const automation = buttons(applied.render()).find((button) => button.props['data-dshlr-button'] === 'automation')
  assert.equal(automation.props.disabled, true)
  assert(automation.props['aria-label'].includes('未安装'))
})

await check('active panel highlights the matching rail button', () => {
  const applied = scenario({ activePanel: 'plugins' })
  const pluginButton = buttons(applied.render()).find((button) => button.props['data-dshlr-button'] === 'plugins')
  assert(String(pluginButton.props.className).includes('dshlr-active'))
})

await check('native plugin and automation sidebar rows are hidden', () => {
  const applied = scenario()
  assert.deepEqual(applied.panelButtons.map((button) => button.hidden), [true, true])
})

await check('the active icon path keeps an unconditional hook order', () => {
  const local = clientSource.slice(clientSource.indexOf('function OriginalIcon'), clientSource.indexOf('function hideNativePanelRows'))
  assert(local.indexOf('useEffect') < local.indexOf("if (active)"), 'useEffect must run before the active return')
})

await check('the active rail item uses a filled glyph', () => {
  const applied = scenario({ activePanel: 'plugins' })
  const tree = applied.render()
  const pluginButton = buttons(tree).find((button) => button.props['data-dshlr-button'] === 'plugins')
  const svg = findAll(pluginButton, (element) => element.type === 'svg')[0]
  assert.equal(svg.props.fill, 'currentColor')
  const chatButton = buttons(tree).find((button) => button.props['data-dshlr-button'] === 'chat')
  const chatSvg = findAll(chatButton, (element) => element.type === 'svg')[0]
  assert.notEqual(chatSvg.props.fill, 'currentColor')
})

await check('settings menu exposes account, settings, feedback and logout', () => {
  assert(clientSource.includes("'data-dshlr-menu-item': 'settings'"))
  assert(clientSource.includes("'data-dshlr-menu-item': 'feedback'"))
  assert(clientSource.includes("'data-dshlr-menu-item': 'logout'"))
  assert(clientSource.includes("'rail.account'"))
})

await check('settings action clicks the host settings control', () => {
  const applied = scenario()
  applied.injected.actions.openSettings()
  assert.equal(applied.settingsClicks.length, 1)
})

console.log('\n' + (process.exitCode === 1 ? 'some checks failed' : 'all checks passed (' + checks + ')'))
