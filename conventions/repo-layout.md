# 仓库目录规范

一条硬要求，其余都是建议。

## 硬要求：站点产物的相对引用必须在 site 范围内自洽

`portal.json` 的 `site` 指向站点根，站点内所有相对引用都不能越出这个范围。

为什么是硬的：站点要在**三处**都能直接打开——本地 `file://`、GitHub Pages、
门户镜像。相对路径是唯一在三处都成立的写法；一旦向上跨出站点根，同步范围、
鉴权边界和相对路径就会各自对不齐。

## 推荐结构

```
<repo>/
├── portal.json              站点契约
├── index.html               入口（entry）
├── assets/
│   └── theme/               xavierstudio-site-kit 同步产物，勿手改
│       ├── tokens.css
│       ├── base.css
│       └── manifest.json
├── <内容目录>/               实际页面，如 public/ 或 outputs/
├── data/                    结构化数据（如页面要读）
└── tools/                   生成脚本，exclude 掉
```

站点根即仓库根（`"site": "."`）是最省事的选择：入口在显眼位置，
相对路径层级浅。只有当仓库里同时有大量非站点内容时，才考虑把站点收进子目录。

## 建议

- **分支名统一 `main`**。Health 目前是 `master`，配置里写死也能跑，但统一省心。
- **生成的页面不要手改**。能被脚本重新生成的东西，改动要落在脚本里，
  否则下次重新生成就被覆盖。Health 的根 `index.html` 就是这个教训：
  它原先手工维护，新增体检批次后会立刻过期，后来改由 ingest 脚本一并生成。
- **生成脚本不要硬编码绝对路径**。用脚本位置推导仓库根。
- **大体积原始素材放在站点范围外**，或用 `exclude` 排除。
- **页面不准写死色值与字号**，只引用 `assets/theme/tokens.css` 的令牌。

## 样式三层

| 层 | 在哪 | 约束 |
|---|---|---|
| 一层 · 令牌 | `assets/theme/tokens.css` | 唯一真相源，由 xavierstudio-site-kit 同步 |
| 二层 · 基础 | `assets/theme/base.css` | 只引用一层，由 xavierstudio-site-kit 同步 |
| 三层 · 页面局部 | 各页 `<style>` | 自造组件允许保留，只能引用一层令牌 |

第三层是故意留的。手写内容页各有各的结构（词汇表、流程图、时间线），
强行塞进统一组件集只会别扭；共享令牌就足以统一观感。

页面局部样式写在 `<link>` 之后，同名类会覆盖基础层——这是预期行为，
但要留意只覆盖需要的属性，别把继承链打断。

## 已接入的仓库

| 仓库 | site | visibility | theme 目录 |
|---|---|---|---|
| `archili2035/AIKnowledge` | `.` | public | `assets/theme` |
| `archili2035/Health` | `.` | private | `assets/theme` |
| `home-portal` | 不适用 | 门户自身 | `src/styles/theme` |
