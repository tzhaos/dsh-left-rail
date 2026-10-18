# dsh-left-rail

简体中文 | [English](README.en.md)

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 客户端插件：在现有
侧边栏左侧新增一条 Codex 风格的图标栏，作为 **会话 / 自动化任务 / 插件 / 设置** 的入口。

## 为什么

DSH 把“插件”和“自动化任务”放在侧边栏顶部的宽文本行里。Codex 的做法是窄图标栏：图标常驻，
侧边栏负责内容。这个插件把入口收进左侧图标栏，主界面更像 Codex。

## 行为

- 在窗口最左侧预留 46px 图标栏，`#root` 同步右移
- 图标顺序：会话、插件、自动化任务、设置
- 会话入口使用主页（house）图标（沿用 DSH 现有顺序）
- 点击会话：回到 Conversation 主面板
- 点击插件/自动化任务：通过 `ctx.layout.selectPanel()` 切换对应主面板
- 面板未安装时图标禁用并提示
- 设置：点击宿主现有的设置按钮
- 主题 token、hover、focus 状态与宿主一致

## 实现

1. 注入 CSS，把 `#root` 右移 46px，并在左侧渲染固定 rail；
2. 读取 `ctx.layout.panelInfo` 判断当前激活面板；
3. 用 `ctx.layout.hasMainPanel()` 检查插件/自动化任务面板是否安装；
4. 点击时调用 `ctx.layout.selectPanel()`；
5. 设置入口查找宿主的 `button[aria-label="设置"]` / `"Settings"` 并点击。

不修改 DSH 侧边栏内容，不接管宿主路由。

## 安装

```text
plugin_manager(action="install_bundle", target="<monorepo>/packages/dsh-left-rail")
```

或安装整个 monorepo：

```powershell
git clone --recurse-submodules https://github.com/tzhaos/dsh-plugins.git
cd dsh-plugins
node scripts/install-all.mjs
```

安装后完全退出 DSH 再启动。

## 已知限制

- 自动化任务面板只有在 DSH 已注册 `schedules` 主面板时可用；未安装时图标禁用
- 设置入口依赖宿主设置按钮的 aria-label；DSH 改文案后需适配
- 左侧图标栏固定占 46px，窄屏下可用空间会减少
- 不改宿主侧边栏的展开/收起逻辑

## 开发与测试

```sh
node scripts/check.mjs
```

零依赖测试覆盖清单/patch/locale/icon、四个入口顺序、面板切换、禁用状态、active 高亮和设置按钮，
共 23 项检查。

## 许可证

[MIT](LICENSE)
