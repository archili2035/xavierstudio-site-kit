#!/usr/bin/env node
/**
 * 仓库合规检查。规范靠文档维持不住，靠这个脚本维持。
 *
 *   node scripts/check-repo.mjs <仓库路径> [<仓库路径> ...]
 *
 * 退出码非 0 表示有 error 级问题。
 */
import fs from "node:fs";
import path from "node:path";

const KIT = path.resolve(import.meta.dirname, "..");
const THEME_VERSION = JSON.parse(
  fs.readFileSync(path.join(KIT, "theme", "manifest.json"), "utf8"),
).version;

function globToRe(glob) {
  const re = glob
    .split("/")
    .map((seg) =>
      seg === "**" ? "(?:.+)" : seg.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*"),
    )
    .join("/")
    .replace(/\(\?:\.\+\)\//g, "(?:.+/)?");
  return new RegExp(`^${re}$`);
}

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out;
}

function checkRepo(repoPath) {
  const repo = path.resolve(repoPath);
  const name = path.basename(repo);
  const issues = [];
  const add = (level, msg) => issues.push({ level, msg });

  const pjPath = path.join(repo, "portal.json");
  if (!fs.existsSync(pjPath)) {
    add("error", "缺少 portal.json");
    return { name, issues };
  }

  let pj;
  try {
    pj = JSON.parse(fs.readFileSync(pjPath, "utf8"));
  } catch (e) {
    add("error", `portal.json 不是合法 JSON：${e.message}`);
    return { name, issues };
  }

  for (const k of ["title", "summary", "visibility", "site", "entry"]) {
    if (!pj[k]) add("error", `portal.json 缺少必填字段 ${k}`);
  }
  if (pj.visibility && !["public", "private"].includes(pj.visibility)) {
    add("error", `visibility 只能是 public 或 private，当前是 ${pj.visibility}`);
  }

  const siteRoot = !pj.site || pj.site === "." ? "" : `${String(pj.site).replace(/\/$/, "")}/`;
  const siteDir = path.join(repo, siteRoot);
  if (!fs.existsSync(siteDir)) {
    add("error", `site 指向的目录不存在：${pj.site}`);
    return { name, issues };
  }

  // 入口存在性
  if (pj.entry && !fs.existsSync(path.join(siteDir, pj.entry))) {
    add("error", `entry 文件不存在：${siteRoot}${pj.entry}`);
  }

  // 同步范围
  const all = walk(repo);
  const inc = (pj.include || ["**"]).map(globToRe);
  const exc = (pj.exclude || []).map(globToRe);
  const inScope = all
    .filter((p) => p.startsWith(siteRoot))
    .filter((p) => inc.some((r) => r.test(p)) && !exc.some((r) => r.test(p)))
    .map((p) => p.slice(siteRoot.length));

  if (pj.entry && !inScope.includes(pj.entry)) {
    add("error", `entry 不在 include 范围内：${pj.entry}`);
  }

  // theme 版本与可达性
  const themeDir = pj.theme_dir || "assets/theme";
  if (!fs.existsSync(path.join(repo, themeDir, "tokens.css"))) {
    add("error", `未安装 theme：${themeDir}/tokens.css 不存在，跑 sync-theme`);
  } else {
    if (!pj.theme_version) {
      add("warn", "portal.json 没有 theme_version，无法判断是否过期");
    } else if (pj.theme_version !== THEME_VERSION) {
      add("warn", `theme 落后：仓库 ${pj.theme_version}，xavierstudio-site-kit ${THEME_VERSION}，跑 sync-theme`);
    }
    // 私有站的样式表必须在白名单里，否则阅读器取不到，整页裸奔
    const themeInScope = inScope.some((p) => p.includes(`${path.basename(themeDir)}/tokens.css`));
    if (!themeInScope) {
      add(
        pj.visibility === "private" ? "error" : "warn",
        `theme 不在 include 范围内，门户拿不到样式：补一条 ${themeDir}/*.css`,
      );
    }
  }

  // 页面写死色值
  const htmlFiles = inScope.filter((p) => /\.html?$/i.test(p));
  const offenders = [];
  for (const rel of htmlFiles) {
    const src = fs.readFileSync(path.join(siteDir, rel), "utf8");
    const styles = src.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
    const hex = styles.join("\n").match(/#[0-9a-fA-F]{3,8}\b/g) || [];
    if (hex.length) offenders.push(`${rel}（${hex.length} 处）`);
  }
  if (offenders.length) {
    add("warn", `页面局部样式里有写死色值，应改为引用令牌：\n      ${offenders.join("\n      ")}`);
  }

  // 未接入 theme 的页面
  const noTheme = htmlFiles.filter((rel) => {
    const src = fs.readFileSync(path.join(siteDir, rel), "utf8");
    return !src.includes("theme/tokens.css");
  });
  if (noTheme.length) {
    add("warn", `${noTheme.length} 个页面未引用 theme：\n      ${noTheme.join("\n      ")}`);
  }

  return { name, issues, stats: { files: inScope.length, html: htmlFiles.length } };
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("用法: node scripts/check-repo.mjs <仓库路径> [...]");
  process.exit(1);
}

let hasError = false;
for (const t of targets) {
  const { name, issues, stats } = checkRepo(t);
  const errs = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  if (errs.length) hasError = true;

  const mark = errs.length ? "✗" : warns.length ? "!" : "✓";
  const tail = stats ? `  站点内 ${stats.files} 个文件 / ${stats.html} 个页面` : "";
  console.log(`\n${mark} ${name}${tail}`);
  for (const i of errs) console.log(`    error  ${i.msg}`);
  for (const i of warns) console.log(`    warn   ${i.msg}`);
  if (!issues.length) console.log("    全部通过");
}

console.log(`\nxavierstudio-site-kit theme v${THEME_VERSION}`);
process.exit(hasError ? 1 : 0);
