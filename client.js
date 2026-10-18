/**
 * Left Rail — browser half of `dsh-left-rail`.
 *
 * Codex puts a narrow icon column left of its conversation sidebar. DSH's
 * sidebar starts at the viewport edge, so this plugin reserves a 46px column,
 * shifts `#root` right and renders the rail there. Icons select the built-in
 * conversation/plugins/automation panels, or click the host settings control.
 *
 * @module dsh-left-rail/client
 */

window.__ModuleLoader__.load({
  id: 'dsh-left-rail',
  factory(require) {
    const React = require('react')
    const { useEffect, useState } = React
    const h = React.createElement

    const NS = 'leftRail'

    const zh = {
      'rail.chat': '会话',
      'rail.automation': '自动化任务',
      'rail.plugins': '插件',
      'rail.settings': '设置',
      'rail.unavailable': '{name}面板未安装',
    }

    const en = {
      'rail.chat': 'Conversations',
      'rail.automation': 'Automation',
      'rail.plugins': 'Plugins',
      'rail.settings': 'Settings',
      'rail.unavailable': '{name} panel is not installed',
    }

    const ICONS = {
      chat: ['M4 4.5h8a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H8L4 14v-2.5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z', 'M5.5 7.5h5M5.5 9.5h3'],
      automation: ['M8 3.2a4.8 4.8 0 1 1-3.4 1.4', 'M3 4v3h3', 'M8 5.5V8l1.8 1.1'],
      plugins: ['M6 3.5h4v2.2a1.3 1.3 0 1 0 0 2.6v2.2H3.5v-2.2a1.3 1.3 0 1 0 0-2.6V3.5Z', 'M12.5 8.5v4h-2.2a1.3 1.3 0 1 0-2.6 0H3.5v-4'],
      settings: ['M8 6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z', 'M8 2.7v1.2M8 12.1v1.2M2.7 8h1.2M12.1 8h1.2M4.25 4.25l.85.85M10.9 10.9l.85.85M11.75 4.25l-.85.85M5.1 10.9l-.85.85'],
    }

    /** @param {string} name @param {number} size @returns {object} SVG icon. */
    function Icon({ name, size = 18 }) {
      const paths = ICONS[name] ?? ICONS.chat
      return h('svg', {
        viewBox: '0 0 16 16',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.35,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      }, paths.map((d, index) => h('path', { key: index, d })))
    }

    /** @returns {Element|null} host settings button. */
    function settingsButton() {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return null
      for (const button of document.querySelectorAll('button[aria-label]')) {
        const label = button.getAttribute?.('aria-label') ?? ''
        if (label === '设置' || label === 'Settings') return button
      }
      return null
    }

    /**
     * One rail button.
     * @param {object} props - name, label, active, disabled, onClick and icons.
     * @returns {object} button element.
     */
    function RailButton({ name, label, active, disabled, onClick }) {
      return h('button', {
        type: 'button',
        className: 'dshlr-button' + (active ? ' dshlr-active' : ''),
        'data-dshlr-button': name,
        'aria-label': label,
        title: label,
        disabled,
        onClick,
      }, h(Icon, { name }))
    }

    /**
     * The fixed left rail.
     * @param {object} props - injected navigation actions and translator.
     * @returns {object} rail.
     */
    function LeftRail({ actions, t }) {
      const [active, setActive] = useState(actions.activePanel())
      useEffect(() => actions.subscribe(setActive), [actions])
      return h('nav', { className: 'dshlr-rail', 'data-dshlr-rail': '' },
        h(RailButton, {
          name: 'chat',
          label: t('rail.chat'),
          active: active === null,
          onClick: () => actions.openChat(),
        }),
        h(RailButton, {
          name: 'automation',
          label: actions.hasPanel('schedules')
            ? t('rail.automation')
            : t('rail.unavailable', { name: t('rail.automation') }),
          active: active === 'schedules',
          disabled: !actions.hasPanel('schedules'),
          onClick: () => actions.openPanel('schedules'),
        }),
        h(RailButton, {
          name: 'plugins',
          label: actions.hasPanel('plugins')
            ? t('rail.plugins')
            : t('rail.unavailable', { name: t('rail.plugins') }),
          active: active === 'plugins',
          disabled: !actions.hasPanel('plugins'),
          onClick: () => actions.openPanel('plugins'),
        }),
        h('span', { className: 'dshlr-spacer' }),
        h(RailButton, {
          name: 'settings',
          label: t('rail.settings'),
          active: false,
          onClick: () => actions.openSettings(),
        }))
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'left-rail: dictionaries')
      ctx.effect(() => {
        if (typeof document === 'undefined' || typeof document.createElement !== 'function') return () => {}
        const style = document.createElement('style')
        style.dataset.dshPlugin = 'dsh-left-rail'
        style.textContent = `html { --dsh-left-rail-width: 46px; }
#root { margin-left: var(--dsh-left-rail-width); width: calc(100% - var(--dsh-left-rail-width)); }
.dshlr-rail {
  position: fixed;
  inset: 0 auto 0 0;
  width: var(--dsh-left-rail-width);
  z-index: 95;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  padding: calc(var(--dsh-frame-top-clearance, 0px) + 8px) 6px 10px;
  background: var(--dsw-specific-sidebar-fill);
  border-right: .5px solid var(--dsw-alias-border-l3);
  -webkit-app-region: no-drag;
}
.dshlr-button {
  box-sizing: border-box;
  width: 34px;
  height: 34px;
  flex: none;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
}
.dshlr-button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dshlr-button:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: 1px;
}
.dshlr-button.dshlr-active {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dshlr-button:disabled {
  opacity: .35;
  cursor: default;
}
.dshlr-spacer { flex: 1; }
`
        document.head?.appendChild?.(style)
        return () => style.remove?.()
      }, 'left-rail: styles')

      const layout = typeof ctx.get === 'function' ? ctx.get('layout') : undefined
      if (layout?.panelInfo === undefined) return
      const actions = {
        activePanel: () => layout.panelInfo.getSnapshot().activePanelId ?? null,
        subscribe(listener) {
          return layout.panelInfo.subscribe(() => listener(actions.activePanel()))
        },
        hasPanel: (id) => layout.hasMainPanel(id),
        openChat: () => layout.selectPanel(null),
        openPanel: (id) => {
          if (layout.hasMainPanel(id)) layout.selectPanel(id)
        },
        openSettings: () => settingsButton()?.click(),
      }
      ctx.effect(() => ctx.slots.register({
        name: 'shell.overlay',
        id: 'left-rail.overlay',
        locale: NS,
        inject: () => ({ actions }),
      }, LeftRail), 'left-rail: overlay')
    }

    return {
      inject: ['slots', 'locale'],
      apply,
    }
  },
})
