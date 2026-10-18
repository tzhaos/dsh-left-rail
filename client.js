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
    const { useEffect, useRef, useState } = React
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
      chat: ['M2.5 7.2 8 2.8l5.5 4.4V13a1 1 0 0 1-1 1H9.5v-3.4h-3V14H3.5a1 1 0 0 1-1-1Z'],
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

    /**
     * Read the SVG the Host already renders for a panel row, so the rail uses
     * the product's own icon instead of a hand-drawn substitute.
     * @param {string} kind - plugins, automation or settings.
     * @returns {string} serialized SVG markup, or '' when unavailable.
     */
    function hostGlyphMarkup(kind) {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return ''
      const labels = kind === 'plugins' ? ['插件', 'Plugins']
        : kind === 'automation' ? ['自动化', 'Automation', 'Scheduled']
          : ['设置', 'Settings']
      for (const button of document.querySelectorAll('button[aria-label]')) {
        if (button.closest?.('[data-dshlr-rail]') !== null && button.closest?.('[data-dshlr-rail]') !== undefined) continue
        const label = button.getAttribute?.('aria-label') ?? ''
        if (!labels.some((candidate) => label.startsWith(candidate))) continue
        const svg = button.querySelector?.('svg')
        if (svg !== null && svg !== undefined) return svg.outerHTML ?? ''
      }
      return ''
    }

    /**
     * Prefer the Host's original panel glyph; fall back to the rail drawing
     * until the sidebar panel list has mounted (or if the panel is absent).
     * @param {object} props - icon kind and fallback name.
     * @returns {object} glyph element.
     */
    function OriginalIcon({ kind }) {
      const [markup, setMarkup] = useState('')
      useEffect(() => {
        let alive = true
        const paint = () => {
          if (!alive) return
          const next = hostGlyphMarkup(kind)
          if (next !== '') setMarkup(next)
        }
        paint()
        const observer = typeof MutationObserver === 'function' ? new MutationObserver(paint) : null
        observer?.observe?.(document.body, { childList: true, subtree: true })
        const timer = typeof setInterval === 'function' ? setInterval(paint, 800) : null
        return () => {
          alive = false
          observer?.disconnect?.()
          if (timer !== null) clearInterval(timer)
        }
      }, [kind])
      if (markup !== '') return h('span', { className: 'dshlr-glyph', dangerouslySetInnerHTML: { __html: markup } })
      return h(Icon, { name: kind })
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
    function RailButton({ name, label, active, disabled, onClick, onTip }) {
      return h('button', {
        type: 'button',
        className: 'dshlr-button' + (active ? ' dshlr-active' : ''),
        'data-dshlr-button': name,
        'aria-label': label,
        disabled,
        onMouseEnter: (event) => onTip?.(event.currentTarget, label),
        onMouseLeave: () => onTip?.(null),
        onFocus: (event) => onTip?.(event.currentTarget, label),
        onBlur: () => onTip?.(null),
        onClick,
      }, h(OriginalIcon, { kind: name }))
    }

    /**
     * The fixed left rail.
     * @param {object} props - injected navigation actions and translator.
     * @returns {object} rail.
     */
    function LeftRail({ actions, t }) {
      const [active, setActive] = useState(actions.activePanel())
      const [tip, setTip] = useState(null)
      const tipRef = useRef(null)
      useEffect(() => actions.subscribe(setActive), [actions])
      useEffect(() => {
        if (tip === null || tipRef.current === null) return undefined
        const place = () => {
          const box = tipRef.current?.getBoundingClientRect?.()
          const anchor = tip.element?.getBoundingClientRect?.()
          if (box === undefined || anchor === undefined) return
          const viewportWidth = window.innerWidth ?? document.documentElement.clientWidth
          const viewportHeight = window.innerHeight ?? document.documentElement.clientHeight
          const gap = 8
          const edge = 8
          let left = anchor.right + gap
          if (left + box.width > viewportWidth - edge) left = anchor.left - gap - box.width
          left = Math.max(edge, Math.min(viewportWidth - box.width - edge, left))
          let top = anchor.top + (anchor.height - box.height) / 2
          top = Math.max(edge, Math.min(viewportHeight - box.height - edge, top))
          tipRef.current.style.left = left + 'px'
          tipRef.current.style.top = top + 'px'
        }
        place()
        window.addEventListener('resize', place)
        document.addEventListener('scroll', place, true)
        return () => {
          window.removeEventListener('resize', place)
          document.removeEventListener('scroll', place, true)
        }
      }, [tip])
      const showTip = (element, label) => setTip(element === null ? null : { element, label })
      return h('nav', { className: 'dshlr-rail', 'data-dshlr-rail': '' },
        h(RailButton, {
          name: 'chat',
          label: t('rail.chat'),
          active: active === null,
          onClick: () => actions.openChat(),
          onTip: showTip,
        }),
        h(RailButton, {
          name: 'plugins',
          label: actions.hasPanel('plugins')
            ? t('rail.plugins')
            : t('rail.unavailable', { name: t('rail.plugins') }),
          active: active === 'plugins',
          disabled: !actions.hasPanel('plugins'),
          onClick: () => actions.openPanel('plugins'),
          onTip: showTip,
        }),
        h(RailButton, {
          name: 'automation',
          label: actions.hasPanel('schedules')
            ? t('rail.automation')
            : t('rail.unavailable', { name: t('rail.automation') }),
          active: active === 'schedules',
          disabled: !actions.hasPanel('schedules'),
          onClick: () => actions.openPanel('schedules'),
          onTip: showTip,
        }),
        h('span', { className: 'dshlr-spacer' }),
        h(RailButton, {
          name: 'settings',
          label: t('rail.settings'),
          active: false,
          onClick: () => actions.openSettings(),
          onTip: showTip,
        }),
        tip === null ? null : h('div', { ref: tipRef, className: 'dshlr-tooltip', role: 'tooltip' }, tip.label))
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'left-rail: dictionaries')
      ctx.effect(() => {
        if (typeof document === 'undefined' || typeof document.createElement !== 'function') return () => {}
        const style = document.createElement('style')
        style.dataset.dshPlugin = 'dsh-left-rail'
        style.textContent = `html { --dsh-left-rail-width: 64px; }
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
  padding: calc(var(--dsh-frame-top-clearance, 0px) + 54px) 6px 10px;
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
.dshlr-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}
.dshlr-glyph svg { display: block; }
.dshlr-tooltip {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 97;
  max-width: 220px;
  padding: 5px 8px;
  border-radius: 6px;
  background: var(--dsw-alias-label-primary);
  color: var(--dsw-alias-bg-base);
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: var(--dsw-elevation-soft);
}
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
