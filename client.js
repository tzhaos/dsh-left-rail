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
      'rail.toggle': '展开／收起左侧栏',
      'rail.account': '本地账号',
      'rail.feedback': '意见反馈',
      'rail.logout': '退出登录',
      'rail.menu': '设置菜单',
      'rail.unavailable': '{name}面板未安装',
    }

    const en = {
      'rail.chat': 'Conversations',
      'rail.automation': 'Automation',
      'rail.plugins': 'Plugins',
      'rail.settings': 'Settings',
      'rail.toggle': 'Toggle left sidebar',
      'rail.account': 'Local account',
      'rail.feedback': 'Feedback',
      'rail.logout': 'Log out',
      'rail.menu': 'Settings menu',
      'rail.unavailable': '{name} panel is not installed',
    }

    const ICONS = {
      chat: ['M2.5 7.2 8 2.8l5.5 4.4V13a1 1 0 0 1-1 1H9.5v-3.4h-3V14H3.5a1 1 0 0 1-1-1Z'],
      automation: ['M8 3.2a4.8 4.8 0 1 1-3.4 1.4', 'M3 4v3h3', 'M8 5.5V8l1.8 1.1'],
      plugins: ['M6 3.5h4v2.2a1.3 1.3 0 1 0 0 2.6v2.2H3.5v-2.2a1.3 1.3 0 1 0 0-2.6V3.5Z', 'M12.5 8.5v4h-2.2a1.3 1.3 0 1 0-2.6 0H3.5v-4'],
      settings: ['M8 6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z', 'M8 2.7v1.2M8 12.1v1.2M2.7 8h1.2M12.1 8h1.2M4.25 4.25l.85.85M10.9 10.9l.85.85M11.75 4.25l-.85.85M5.1 10.9l-.85.85'],
    }

    /** Solid glyphs used only for the active rail item. */
    const FILLED_ICONS = {
      chat: ['M2.2 7.1 8 2.4l5.8 4.7V13a1.2 1.2 0 0 1-1.2 1.2H9.6v-3.4H6.4v3.4H3.4A1.2 1.2 0 0 1 2.2 13Z'],
      plugins: ['M5.7 3.2h4.6v1.9a1.5 1.5 0 1 0 0 2.8v2.4H8.4a1.5 1.5 0 1 0-2.8 0H3.1V5.7h1.1a1.5 1.5 0 1 1 1.5-2.5Z', 'M10.3 8.3h2.6v4.5H8.3v-1.6a1.5 1.5 0 1 1 2 0Z'],
      automation: ['M8 2.3a5.7 5.7 0 1 0 0 11.4A5.7 5.7 0 0 0 8 2.3Zm-.7 2.9h1.2v3.1l2.2 1.3-.6 1-2.8-1.6Z'],
      settings: ['M6.7 1.8h2.6l.3 1.6c.4.2.8.4 1.1.7l1.5-.6 1.3 2.3-1.2 1.1c.1.4.1.9 0 1.3l1.2 1.1-1.3 2.3-1.5-.6c-.3.3-.7.5-1.1.7l-.3 1.6H6.7l-.3-1.6a4.8 4.8 0 0 1-1.1-.7l-1.5.6-1.3-2.3 1.2-1.1a5 5 0 0 1 0-1.3L2.5 5.8l1.3-2.3 1.5.6c.3-.3.7-.5 1.1-.7Zm1.3 4.1a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z'],
    }

    /** Solid active variant; the outline host glyph remains for inactive items. */
    function FilledIcon({ name, size = 18 }) {
      return h('svg', {
        viewBox: '0 0 16 16',
        width: size,
        height: size,
        fill: 'currentColor',
        'aria-hidden': true,
      }, (FILLED_ICONS[name] ?? FILLED_ICONS.chat).map((d, index) => h('path', { key: index, d })))
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
    function OriginalIcon({ kind, active = false }) {
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
      if (active) return h(FilledIcon, { name: kind })
      if (markup !== '') return h('span', { className: 'dshlr-glyph', dangerouslySetInnerHTML: { __html: markup } })
      return h(Icon, { name: kind })
    }

    /** Hide the native sidebar rows whose entry now lives in the rail. */
    function hideNativePanelRows() {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return
      const labels = ['插件', 'Plugins', '自动化', 'Automation', 'Scheduled']
      for (const button of document.querySelectorAll('button[aria-label]')) {
        if (button.closest?.('[data-dshlr-rail]') !== null && button.closest?.('[data-dshlr-rail]') !== undefined) continue
        const label = button.getAttribute?.('aria-label') ?? ''
        if (labels.some((candidate) => label.startsWith(candidate))) button.setAttribute?.('data-dshlr-hidden', '')
      }
    }

    /** Hide the host titlebar toggle; the rail renders a matching control after the arrows. */
    function hideNativeSidebarToggle() {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return
      for (const button of document.querySelectorAll('button[aria-label]')) {
        if (button.hasAttribute?.('data-dshlr-toggle') === true) continue
        if (button.closest?.('[data-dshlr-rail]') !== null && button.closest?.('[data-dshlr-rail]') !== undefined) continue
        const label = button.getAttribute?.('aria-label') ?? ''
        if (/左侧栏|侧边栏|sidebar/i.test(label)) button.setAttribute?.('data-dshlr-hidden', '')
      }
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

    /** @param {string[]} labels @returns {Element|null} first matching host button. */
    function actionButton(labels) {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return null
      for (const button of document.querySelectorAll('button[aria-label]')) {
        if (button.closest?.('[data-dshlr-rail]') !== null && button.closest?.('[data-dshlr-rail]') !== undefined) continue
        const label = button.getAttribute?.('aria-label') ?? ''
        if (labels.some((candidate) => label === candidate || label.includes(candidate))) return button
      }
      return null
    }

    /** Read the host's existing account label/avatar when it is rendered on the right. */
    function detectAccount() {
      if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return { email: '', avatar: '' }
      let email = ''
      for (const node of document.querySelectorAll('span, div')) {
        if (node.children?.length > 0) continue
        const text = node.textContent?.trim() ?? ''
        if (text.length <= 64 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) { email = text; break }
      }
      let avatar = ''
      for (const image of document.querySelectorAll('img')) {
        const src = image.getAttribute?.('src') ?? ''
        if (src !== '') { avatar = src; break }
      }
      return { email, avatar }
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
      }, h(OriginalIcon, { kind: name, active }))
    }

    /**
     * Codex-style account/settings popover anchored beside the rail.
     * @param {object} props - account, actions, translator and close callback.
     * @returns {object} menu.
     */
    function SettingsMenu({ account, actions, t, onClose }) {
      return h('div', { className: 'dshlr-menu', role: 'menu', 'aria-label': t('rail.menu') },
        h('div', { className: 'dshlr-account' },
          account.avatar === ''
            ? h('span', { className: 'dshlr-avatar', 'aria-hidden': true }, h(Icon, { name: 'settings' }))
            : h('img', { className: 'dshlr-avatar dshlr-avatar-image', src: account.avatar, alt: '' }),
          h('span', { className: 'dshlr-account-text' },
            h('span', { className: 'dshlr-account-name' }, account.email === '' ? t('rail.account') : account.email),
            account.email === '' ? null : h('span', { className: 'dshlr-account-sub' }, t('rail.account')))),
        h('span', { className: 'dshlr-menu-separator' }),
        h('button', { type: 'button', className: 'dshlr-menu-item', role: 'menuitem', 'data-dshlr-menu-item': 'settings', onClick: () => { actions.openSettings(); onClose() } },
          h(Icon, { name: 'settings' }), h('span', null, t('rail.settings'))),
        h('button', { type: 'button', className: 'dshlr-menu-item', role: 'menuitem', 'data-dshlr-menu-item': 'feedback', onClick: () => { actions.openFeedback(); onClose() } },
          h(Icon, { name: 'chat' }), h('span', null, t('rail.feedback'))),
        h('button', { type: 'button', className: 'dshlr-menu-item', role: 'menuitem', 'data-dshlr-menu-item': 'logout', onClick: () => { actions.logout(); onClose() } },
          h(Icon, { name: 'automation' }), h('span', null, t('rail.logout'))))
    }

    /**
     * The fixed left rail.
     * @param {object} props - injected navigation actions and translator.
     * @returns {object} rail.
     */
    function LeftRail({ actions, t }) {
      const [active, setActive] = useState(actions.activePanel())
      const [tip, setTip] = useState(null)
      const [menuOpen, setMenuOpen] = useState(false)
      const [account, setAccount] = useState({ email: '', avatar: '' })
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
      return h(React.Fragment, null,
        h('button', {
          type: 'button',
          className: 'dshlr-toggle',
          'data-dshlr-toggle': '',
          'aria-label': t('rail.toggle'),
          title: t('rail.toggle'),
          onClick: () => actions.toggleSidebar(),
        }, h('svg', { viewBox: '0 0 16 16', width: 13, height: 13, fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, 'aria-hidden': true },
          h('rect', { x: 2.5, y: 3, width: 11, height: 10, rx: 2 }),
          h('path', { d: 'M6.5 3v10' }))),
        h('nav', { className: 'dshlr-rail', 'data-dshlr-rail': '' },
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
          active: menuOpen,
          onClick: () => {
            setAccount(detectAccount())
            setMenuOpen((open) => !open)
            showTip(null)
          },
          onTip: showTip,
        }),
        menuOpen ? h(SettingsMenu, { account, actions, t, onClose: () => setMenuOpen(false) }) : null,
        tip === null ? null : h('div', { ref: tipRef, className: 'dshlr-tooltip', role: 'tooltip' }, tip.label)))
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'left-rail: dictionaries')
      ctx.effect(() => {
        if (typeof document === 'undefined' || typeof document.createElement !== 'function') return () => {}
        const style = document.createElement('style')
        style.dataset.dshPlugin = 'dsh-left-rail'
        style.textContent = `html { --dsh-left-rail-width: 64px; }
[data-dshlr-hidden] { display: none !important; }
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
.dshlr-toggle {
  position: fixed;
  left: 34px;
  top: 9px;
  z-index: 96;
  box-sizing: border-box;
  width: 13px;
  height: 18px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  -webkit-app-region: no-drag;
}
.dshlr-toggle:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dshlr-toggle svg { display: block; }
.dshlr-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}
.dshlr-glyph svg { display: block; }
.dshlr-menu {
  position: fixed;
  left: 72px;
  bottom: 12px;
  z-index: 98;
  width: 232px;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 12px;
  background: var(--dsw-alias-bg-base);
  border: 1px solid var(--dsw-alias-border-l2);
  box-shadow: var(--dsw-elevation-soft);
  color: var(--dsw-alias-label-primary);
  -webkit-app-region: no-drag;
}
.dshlr-account {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 7px 9px;
  min-width: 0;
}
.dshlr-avatar {
  width: 30px;
  height: 30px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-secondary);
}
.dshlr-avatar-image { object-fit: cover; }
.dshlr-account-text { display: flex; flex-direction: column; min-width: 0; }
.dshlr-account-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshlr-account-sub { font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.dshlr-menu-separator { display: block; height: 1px; margin: 2px 7px 6px; background: var(--dsw-alias-border-l2); }
.dshlr-menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  box-sizing: border-box;
  padding: 7px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.dshlr-menu-item:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dshlr-menu-item .dshlr-glyph { width: 16px; height: 16px; color: var(--dsw-alias-label-secondary); }
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

      ctx.effect(() => {
        hideNativePanelRows()
        hideNativeSidebarToggle()
        const observer = typeof MutationObserver === 'function' ? new MutationObserver(() => { hideNativePanelRows(); hideNativeSidebarToggle() }) : null
        observer?.observe?.(document.body, { childList: true, subtree: true })
        const timer = typeof setInterval === 'function' ? setInterval(() => { hideNativePanelRows(); hideNativeSidebarToggle() }, 800) : null
        return () => {
          observer?.disconnect?.()
          if (timer !== null) clearInterval(timer)
          for (const button of document.querySelectorAll?.('[data-dshlr-hidden]') ?? []) button.removeAttribute?.('data-dshlr-hidden')
        }
      }, 'left-rail: hide native panel rows')

      const layout = typeof ctx.get === 'function' ? ctx.get('layout') : undefined
      if (layout?.panelInfo === undefined) return
      const actions = {
        activePanel: () => layout.panelInfo.getSnapshot().activePanelId ?? null,
        subscribe(listener) {
          return layout.panelInfo.subscribe(() => listener(actions.activePanel()))
        },
        hasPanel: (id) => layout.hasMainPanel(id),
        openChat: () => layout.selectPanel(null),
        toggleSidebar: () => layout.toggleSidebar(),
        openPanel: (id) => {
          if (layout.hasMainPanel(id)) layout.selectPanel(id)
        },
        openSettings: () => settingsButton()?.click(),
        openFeedback: () => actionButton(['意见反馈', 'Feedback'])?.click(),
        logout: () => actionButton(['退出登录', 'Log out', 'Sign out'])?.click(),
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
