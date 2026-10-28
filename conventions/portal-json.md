# portal.json 站点契约

每个要被个人门户聚合的仓库，根目录放一个 `portal.json`，由仓库**自己声明**
站点结构。门户与云函数都读它，两边都不硬编码。

## 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | 是 | 展示名，门户卡片标题 |
| `summary` | 是 | 一句话描述 |
| `category` | 否 | 分类，用于门户分组 |
| `visibility` | 是 | `public` 或 `private`，决定走哪条链路 |
| `site` | 是 | 站点根目录，相对仓库根；统一用 `"docs"` |
| `entry` | 是 | 入口文件，相对站点根，通常是一个主题索引页 |
| `include` | 否 | 同步范围 glob 白名单，相对仓库根，缺省为全部 |
| `exclude` | 否 | 排除 glob，相对仓库根，优先级高于 include |
| `theme_version` | 自动 | 由 `sync-theme` 写入，用于漂移检测 |
| `theme_dir` | 自动 | 由 `sync-theme` 写入，theme 落地目录 |

glob 支持 `*`（不跨目录）与 `**`（跨目录）。`include` / `exclude` 相对仓库根，
所以站点根收进 `docs/` 后要带 `docs/` 前缀。

## visibility 的含义

这不是装饰，它决定内容走哪条物理链路：

- `public` — 构建时整站镜像进门户静态产物，**任何人凭 URL 可达**
- `private` — 只产文件清单，正文留在 GitHub，登录后经云函数按需取回，**不落盘**

静态托管没有登录态。写错一个字，私有内容就变成公开 URL。

## 例子

公开站（AIKnowledge）：

```json
{
  "title": "AI 知识库",
  "summary": "AI 概念、模型、产品与方法论的知识图谱与阅读笔记",
  "visibility": "public",
  "site": "docs",
  "entry": "aiknowledge_index.html",
  "include": ["docs/**"],
  "exclude": ["tools/**"]
}
```

私有站（Health）：

```json
{
  "title": "健康档案",
  "summary": "历史体检报告、关键指标与纵向趋势",
  "visibility": "private",
  "site": "docs",
  "entry": "health_index.html",
  "include": [
    "docs/health_index.html", "docs/assets/theme/*.css",
    "docs/health/**/*.html", "docs/data/**/*.json", "docs/reports/processed/**/*.md"
  ],
  "exclude": ["docs/reports/raw/**", "tools/**"]
}
```

## 容易踩的点

- **`include` 必须覆盖 `entry`**，否则同步报错（注意带 `docs/` 前缀）。
- **`include` 必须覆盖 theme**（`docs/assets/theme/*.css`）。私有站尤其要注意：
  阅读器要靠云函数把样式表取回来内联，不在白名单里就拿不到，整页裸奔。
- **大体积原始素材要 `exclude`**。Health 的 `reports/raw/` 有 16MB 图片，
  站点 HTML 并不引用它们，没必要进同步范围。
- 路径一律用正斜杠，相对仓库根，不要以 `/` 开头。
