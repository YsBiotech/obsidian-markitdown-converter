import * as esbuild from "esbuild";

const production = process.argv.includes("production");

esbuild
  .build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outdir: ".",
    external: ["obsidian"],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: production ? false : "inline",
    treeShaking: true,
    platform: "node",
  })
  .catch(() => process.exit(1));
