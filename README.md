# site-kit

个人站点的视觉系统与目录规范。供门户（home-portal）与各内容仓库共同引用，
最终封装成 WorkBuddy Skill，新建仓库时一次性带齐规范。

> 当前状态：**v0.1.2 已落地**。门户、Health、AIKnowledge（入口页 + 锚点页）均已接入。

## 风格口径

苹果官网的**骨架**：排版节奏、大留白、双表面色带交替、药丸按钮、克制的阴影。
**保留个人色**：赭石强调色 `#9c3d2e`、衬线标题、整体偏暖一度的表面色。

苹果的观感很大程度来自摄影与巨幅留白，而这些站点是文字/数据密集页，
照搬会显得空洞。因此取它的排版与表面体系，数据密集组件（表格、指标、
时间线）在同一语言下重新设计。

## 结构

```
theme/
├── tokens.css      一层：设计令牌，唯一真相源
├── base.css        二层：重置、排版、组件原语
└── preview.html    组件总览页，验收与回归的唯一依据
```

三层样式模型：

| 层 | 内容 | 约束 |
|---|---|---|
| 一层 · 令牌 | 颜色、字阶、间距、圆角、版面宽度 | 页面不准写死色值与字号 |
| 二层 · 基础 | 重置、排版节奏、容器、色带、卡片、按钮、表格、药丸 | 只引用一层 |
| 三层 · 页面局部 | 各页自造组件（如知识库的 `glossary-block`） | 允许保留，但只能引用一层令牌 |

第三层的存在是关键：手写内容页不必被塞进统一组件集，只要共享令牌即可统一观感。

## 组件词汇

沿用 Health 仓库既有的一套：`page` `hero` `section` `card` `grid` `stats` `stat`
`timeline` `row` `date` `pill` `button` `links` `tag` `lead` `warn` `note` `muted` `alert`。

它是现存三套页面里最系统的（由单一生成脚本产出），收为规范词汇后，
那 16 个页面换肤接近零改动。`pill` 的 `red/amber/green/blue/purple` 保留为别名，
底层取语义令牌。

## 接入方式

交付方式决定能否共用一个 CSS 文件：

| 场景 | 方式 | 原因 |
|---|---|---|
| 门户（Astro） | 直接 `import` | 自带构建 |
| 公开站（整站镜像） | 相对 `<link>` | 镜像保留目录结构，本地、GitHub Pages、门户三处都成立 |
| 私有站（iframe srcdoc） | 相对 `<link>` + 阅读器内联 | srcdoc 没有基准 URL，相对路径失效，由阅读器抓取后内联 |

## 本地预览

```bash
python -m http.server 4399
# 打开 http://127.0.0.1:4399/theme/preview.html
```

## 待办

- [x] 视觉验收
- [x] `conventions/`：目录规范、portal.json 契约
- [x] `scripts/`：`init-repo` / `sync-theme` / `check-repo`
- [x] 接入门户 → Health → AIKnowledge 锚点页
- [x] 修掉阅读器把 `<link>` 一并改写的 bug
- [ ] AIKnowledge 剩余 9 个页面迁移
- [ ] Health 的 QUICKSTART.html / README.html 迁移
- [ ] 推 GitHub 并装为用户级 Skill
