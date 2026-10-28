#!/usr/bin/env node
/**
 * 把 site-kit 的 theme 同步到目标仓库，并把版本号写进该仓库的 portal.json。
 *
 *   node scripts/sync-theme.mjs <目标仓库路径> [--dir assets/theme]
 *
 * 为什么是「拷贝」而不是「引用」：
 * 各仓库的 HTML 要在本地 file://、GitHub Pages、门户镜像三处都能直接打开，
 * 不能依赖任何外部地址。拷贝换来自包含，代价是需要显式同步 —— 由
 * portal.json 的 theme_version 配合 check-repo 暴露漂移。
 */
import fs from "node:fs";
import path from "node:path";

const KIT = path.resolve(import.meta.dirname, "..");
const THEME = path.join(KIT, "theme");

function parseArgs(argv) {
  const [target, ...rest] = argv;
  let dir = "assets/theme";
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === "--dir" && rest[i + 1]) dir = rest[++i];
  }
  return { target, dir };
}

function main() {
  const { target, dir } = parseArgs(process.argv.slice(2));
  if (!target) {
    console.error("用法: node scripts/sync-theme.mjs <目标仓库路径> [--dir assets/theme]");
    process.exit(1);
  }

  const repo = path.resolve(target);
  if (!fs.existsSync(repo)) {
    console.error(`目标仓库不存在: ${repo}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(THEME, "manifest.json"), "utf8"));
  const dest = path.join(repo, dir);
  fs.mkdirSync(dest, { recursive: true });

  for (const f of manifest.files) {
    fs.copyFileSync(path.join(THEME, f), path.join(dest, f));
    console.log(`  ${dir}/${f}`);
  }
  // 带上 manifest，让目标仓库自己也能看出装的是哪一版
  fs.copyFileSync(path.join(THEME, "manifest.json"), path.join(dest, "manifest.json"));

  const pjPath = path.join(repo, "portal.json");
  if (fs.existsSync(pjPath)) {
    const pj = JSON.parse(fs.readFileSync(pjPath, "utf8"));
    const before = pj.theme_version;
    pj.theme_version = manifest.version;
    pj.theme_dir = dir;
    fs.writeFileSync(pjPath, JSON.stringify(pj, null, 2) + "\n", "utf8");
    console.log(
      before === manifest.version
        ? `  portal.json theme_version 保持 ${manifest.version}`
        : `  portal.json theme_version ${before ?? "(无)"} → ${manifest.version}`,
    );
  } else {
    console.warn("  注意：目标仓库没有 portal.json，版本号未记录");
  }

  console.log(`[sync-theme] site-kit v${manifest.version} → ${repo}`);
}

main();
