---
name: xavierstudio-site-kit
description: 个人站点的视觉系统与目录规范。新建或改造内容仓库（HTML 站点）、统一页面视觉、处理 portal.json 站点契约、组织网页目录与主题索引页、把仓库接入个人门户时使用。含设计令牌、组件原语、脚手架与合规检查脚本。触发词：xavierstudio-site-kit、site-kit、视觉规范、统一样式、设计令牌、portal.json、docs 目录、索引页、网页组织、新建内容仓库、接入门户、theme 同步。
---

# xavierstudio-site-kit

个人站点共用的视觉系统与目录规范。门户（home-portal）、AIKnowledge、Health
都接这一套。

## 什么时候用

- 新建一个要放 HTML 内容的 GitHub 仓库
- 给已有仓库统一视觉、接入个人门户
- 组织一个工作空间里的网页（docs 目录、主题索引页）
- 调整配色/字阶/间距（改令牌，不改页面）
- 检查某个仓库是否还守着规范

## 风格口径

苹果官网的**骨架**：排版节奏、大留白、双表面色带交替、药丸按钮、克制阴影。
**保留个人色**：赭石强调色 `#9c3d2e`、衬线标题、整体偏暖一度的表面色。

明确不用：渐变做装饰、厚重阴影、彩色大色块当背景。

苹果的观感很大程度来自摄影与巨幅留白，而这些站点是文字/数据密集页，
照搬会显得空洞。因此取它的排版与表面体系，数据密集组件在同一语言下重新设计。

## 目录与索引页约定

挂接门户的工作空间，网页统一放仓库根下的 `docs/`（站点根），每个主题一个索引页，
命名 `[主题英文名]_index.html`（如 `health_index.html`）。网页必须引用 theme 的
`tokens.css` + `base.css`，与门户视觉一致。详见 `conventions/pages.md`。

## 三层样式模型

| 层 | 文件 | 约束 |
|---|---|---|
| 一层 · 令牌 | `theme/tokens.css` | 唯一真相源。页面不准写死色值与字号 |
| 二层 · 基础 | `theme/base.css` | 重置、排版节奏、组件原语。只引用一层 |
| 三层 · 页面局部 | 各页 `<style>` | 自造组件允许保留，但只能引用一层令牌 |

第三层是故意留的。手写内容页各有各的结构，强行塞进统一组件集只会别扭；
共享令牌就足以统一观感。**改造已有页面的标准手法**：插入两行 `<link>`，
把页面原有的 `:root` 令牌块改为映射到 xavierstudio-site-kit 令牌，再把残留写死色值
按语义替换。组件规则本身基本不动。

## 组件词汇

`page` `page-reading` `page-wide` · `band` `band-alt` `band-inverse` `band-tight` ·
`hero` `tag` `lead` · `section` · `card` `grid` · `stats` `stat` ·
`timeline` `row` `date` · `pill`（`ok` `warn` `danger` `info` `accent`，
并兼容旧名 `green` `amber` `red` `blue` `purple`） ·
`button` `button-quiet` `links` · `alert` `warn` · `muted` `note` `mono` `micro`

实物见 `theme/preview.html`，它是验收与回归的唯一依据。

## 常用操作

```bash
# 新建仓库
node scripts/init-repo.mjs <路径> --title "标题" --summary "描述" --visibility public|private

# 同步 theme 到已有仓库（并写回 portal.json 的 theme_version）
node scripts/sync-theme.mjs <仓库路径> [--dir docs/assets/theme]

# 合规检查：契约合法性、入口存在、theme 版本漂移、写死色值、未接入页面
node scripts/check-repo.mjs <仓库路径> [...]

# 本地看组件总览
python -m http.server 4399   # 打开 /theme/preview.html
```

## 交付方式

交付路径决定能否共用一个 CSS 文件：

| 场景 | 方式 | 原因 |
|---|---|---|
| 门户（Astro） | 直接 `import` | 自带构建 |
| 公开站（整站镜像） | 相对 `<link>` | 镜像保留目录结构，本地、GitHub Pages、门户三处都成立 |
| 私有站（iframe srcdoc） | 相对 `<link>` + 阅读器内联 | srcdoc 没有基准 URL，相对路径失效，由门户阅读器抓取后内联 |

**私有站务必把 `assets/theme/*.css` 写进 `portal.json` 的 `include`**，
否则阅读器取不到样式表，整页裸奔。`check-repo` 会把这条报成 error。

## 踩过的坑

- **`[hidden]` 会被组件的 `display` 压掉**。base.css 的重置里已加
  `[hidden]{display:none!important}` 兜住。
- **标题颜色要继承而非写死**。`h1{color:var(--ink)}` 会把彩色 hero、
  深色色带里的标题压成深色。base.css 用 `color: inherit`。
- **链接改写不能用 `href=` 通配**。门户阅读器曾因此把 `<link rel=stylesheet>`
  一起改写掉。只匹配 `<a>` 标签。
- **生成的页面不要手改**。改动要落在生成脚本里，否则下次重新生成就被覆盖。

## 参考

- `conventions/repo-layout.md` — 目录规范与硬要求
- `conventions/pages.md` — 网页组织与索引页命名
- `conventions/portal-json.md` — 站点契约字段与易错点
- `theme/preview.html` — 组件总览
