/**
 * Host half of the left-rail bundle.
 *
 * The plugin is pure browser UI: it reserves a narrow column left of DSH's
 * layout and renders navigation icons for conversations, automation, plugins
 * and settings. The Host process has nothing to install, but this entry exists
 * so the Client module registry discovers the browser bundle from an active
 * Loader row.
 */
export function apply() {}
