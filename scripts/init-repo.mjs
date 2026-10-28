#!/usr/bin/env node
/**
 * 新仓库脚手架：建目录、写 portal.json、装 theme、生成一个可用的入口页。
 *
 *   node scripts/init-repo.mjs <目标路径> --title "标题" [选项]
 *
 * 选项：
 *   --title     <字符串>  必填，展示名
 *   --summary   <字符串>  一句话描述
 *   --visibility public|private   默认 public
 *   --site      <子目录>  站点根，默认仓库根
 *   --force               目标已存在 portal.json 时仍覆盖
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const KIT = path.resolve(import.meta.dirname, "..");

function parseArgs(argv) {
  const out = { visibility: "public", site: "." };
  out.target = argv[0] && !argv[0].startsWith("--") ? argv[0] : undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") out.force = true;
    else if (a.startsWith("--") && argv[i + 1] !== undefined) out[a.slice(2)] = argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.target || !args.title) {
  console.error('用法: node scripts/init-repo.mjs <目标路径> --title "标题" [--summary "..."] [--visibility public|private] [--site 子目录]');
  process.exit(1);
}
if (!["public", "private"].includes(args.visibility)) {
  console.error("visibility 只能是 public 或 private");
  process.exit(1);
}

const repo = path.resolve(args.target);
const siteRel = args.site === "." ? "" : `${args.site.replace(/\/$/, "")}/`;
const themeDir = `${siteRel}assets/theme`;
const depth = siteRel ? 0 : 0; // 入口页在站点根，theme 相对前缀为空

fs.mkdirSync(path.join(repo, siteRel || "."), { recursive: true });

const pjPath = path.join(repo, "portal.json");
if (fs.existsSync(pjPath) && !args.force) {
  console.error(`已存在 portal.json，要覆盖请加 --force：${pjPath}`);
  process.exit(1);
}

const portal = {
  title: args.title,
  summary: args.summary || args.title,
  visibility: args.visibility,
  site: args.site,
  entry: "index.html",
  include: ["index.html", "assets/**"],
  exclude: ["tools/**", "scripts/**"],
};
fs.writeFileSync(pjPath, JSON.stringify(portal, null, 2) + "\n", "utf8");

// 装 theme（同时把版本号写回 portal.json）
execFileSync(
  process.execPath,
  [path.join(KIT, "scripts", "sync-theme.mjs"), repo, "--dir", themeDir],
  { stdio: "inherit" },
);

const entryPath = path.join(repo, siteRel, "index.html");
if (!fs.existsSync(entryPath)) {
  const prefix = "../".repeat(depth);
  fs.writeFileSync(
    entryPath,
    `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${args.title}</title>
<link rel="stylesheet" href="${prefix}assets/theme/tokens.css">
<link rel="stylesheet" href="${prefix}assets/theme/base.css">
</head>
<body>

<section class="band">
  <div class="page">
    <header class="hero">
      <span class="tag">${args.visibility === "private" ? "private" : "public"}</span>
      <h1>${args.title}</h1>
      <p class="lead">${portal.summary}</p>
    </header>
  </div>
</section>

<section class="band band-alt band-tight">
  <div class="page">
    <h2>目录</h2>
    <div class="grid">
      <div class="card">
        <strong>第一个条目</strong>
        <span>替换成真实内容。可用组件见 site-kit 的 theme/preview.html。</span>
      </div>
    </div>
  </div>
</section>

</body>
</html>
`,
    "utf8",
  );
  console.log(`  ${siteRel}index.html`);
}

const giPath = path.join(repo, ".gitignore");
if (!fs.existsSync(giPath)) {
  fs.writeFileSync(giPath, "node_modules/\n.DS_Store\nThumbs.db\n_*.png\n", "utf8");
  console.log("  .gitignore");
}

console.log(`\n[init-repo] ${args.title}（${args.visibility}）已就绪：${repo}`);
console.log("下一步：");
console.log("  1. 写内容，页面只引用 tokens.css 里的令牌，不要写死色值");
console.log(`  2. 校验：node ${path.relative(process.cwd(), path.join(KIT, "scripts", "check-repo.mjs"))} ${args.target}`);
console.log("  3. 推到 GitHub 后，把仓库加进门户 scripts/sync-repos.mjs 的 REPOS");
