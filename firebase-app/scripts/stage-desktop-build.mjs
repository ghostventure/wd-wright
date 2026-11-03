import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const stageDir = path.join(rootDir, ".desktop-build");

const packageJson = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8"));

await rm(stageDir, { recursive: true, force: true });
await mkdir(stageDir, { recursive: true });

await cp(path.join(rootDir, "electron"), path.join(stageDir, "electron"), { recursive: true });
await cp(path.join(rootDir, "out"), path.join(stageDir, "out"), { recursive: true });
await writeFile(
  path.join(stageDir, "skip-before-build.cjs"),
  "module.exports = async function beforeBuild() { return false; };\n",
  "utf8"
);

const stagePackage = {
  name: "wd-wright-desktop",
  private: true,
  packageManager: "traversal@1.0.0",
  version: packageJson.version,
  description: "WD Wright Windows management desktop shell",
  author: "WD Wright",
  main: "electron/main.cjs",
  build: {
    appId: "com.wdwright.platform",
    productName: "WD Wright Management",
    electronVersion: "41.1.0",
    beforeBuild: "./.desktop-build/skip-before-build.cjs",
    directories: {
      output: "../release",
    },
    files: [
      "out/**/*",
      "electron/**/*",
      "package.json",
    ],
    win: {
      target: [
        "nsis",
      ],
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      artifactName: "WD-Wright-Management-Setup-${version}.${ext}",
    },
  },
};

await writeFile(path.join(stageDir, "package.json"), `${JSON.stringify(stagePackage, null, 2)}\n`, "utf8");
