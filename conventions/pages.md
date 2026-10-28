# 网页组织规范

挂接个人门户的工作空间，网页如何放、如何命名、如何保证与门户视觉一致。

## 硬要求

### 1. 网页统一放 `docs/` 目录

站点根就是 `docs/`，所有 HTML（入口页、主题页、资源）都在它下面，不越出范围。
`portal.json` 的 `site` 指向 `docs`，theme 落 `docs/assets/theme`。

为什么是 `docs/`：GitHub Pages 支持「Deploy from branch → /docs 目录」，
站点根收进 docs 后，本地 `file://`、GitHub Pages、门户镜像三处用同一套相对路径
就能打开。

### 2. 每个主题一个索引页，命名 `[主题英文名]_index.html`

一个工作空间可承载多个主题，每个主题一个索引页，作为该主题的策展式导航入口。
命名用主题英文名（kebab-case 小写）加 `_index.html` 后缀：

- `health_index.html`
- `aiknowledge_index.html`

`entry` 指向其中一个（通常是主要主题的索引页），其余索引用相对链接互达。

### 3. 视觉与门户一致：必须引用 theme

每个页面 `<head>` 挂两条 `<link>`，顺序固定，tokens 必须先于 base：

```html
<link rel="stylesheet" href="assets/theme/tokens.css">
<link rel="stylesheet" href="assets/theme/base.css">
```

页面不写死色值与字号，自造组件只引用令牌。`check-repo` 会把「未引用 theme」
与「写死色值」报出来。

## 建议

### 索引页是策展式入口，不是全量列表

索引页只收明确批准、愿意展示的内容；草稿、隐私页、内部素材不进索引。
它是导航入口，不是目录树。

### 主题内页面放子目录

一个主题若有多个页面，放 `docs/<主题名>/` 下，索引页用相对路径链过去：

```
docs/
├── health_index.html
├── health/
│   └── 2024-checkup.html
├── aiknowledge_index.html
└── aiknowledge/
    └── glossary.html
```

### 相对引用只在 docs 范围内自洽

页面之间、页面到资源一律用相对路径，不越出 docs、不用绝对路径，
保证 file://、GitHub Pages、门户镜像三处都能直接打开。

### 生成的页面不手改

能被脚本重新生成的页面，改动落在生成脚本里，否则下次重生成就被覆盖。

## 存量仓库迁移

AIKnowledge、Health 目前 `site` 仍是 `.`。新规范下把站点收进 `docs/`，
改 `site: "docs"`，theme 同步到 `docs/assets/theme`，入口页改名
`[主题英文名]_index.html`。迁移非强制，但新仓库一律按本规范起。
