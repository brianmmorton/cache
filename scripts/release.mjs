#!/usr/bin/env node
// Bumps @normalized-cache/core and @normalized-cache/react to the same
// version, runs the test/typecheck/build gate, publishes both packages to
// npm (core first, since react depends on it), and commits + tags the
// release. See `node scripts/release.mjs --help`.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const packageDirs = {
  core: path.join(rootDir, "packages", "core"),
  react: path.join(rootDir, "packages", "react"),
};

function printHelp() {
  console.log(`Usage: node scripts/release.mjs <patch|minor|major|<version>> [--dry-run]

Bumps packages/core and packages/react to the same version, runs
test + typecheck + build, publishes both to npm (core first), then
commits and tags the release as "vX.Y.Z".

  --dry-run   Do everything except the actual publish (uses
              \`pnpm publish --dry-run\`) and the final git commit/tag.

Examples:
  node scripts/release.mjs patch
  node scripts/release.mjs minor --dry-run
  node scripts/release.mjs 1.0.0
`);
}

function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(" ")}${options.cwd ? `  (in ${options.cwd})` : ""}`);
  return execFileSync(command, args, {
    stdio: "inherit",
    ...options,
  });
}

function runCapture(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", ...options }).trim();
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Not a valid semver version: "${version}"`);
  }
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

function computeNextVersion(currentVersion, bump) {
  if (bump === "patch" || bump === "minor" || bump === "major") {
    const { major, minor, patch } = parseSemver(currentVersion);
    if (bump === "patch") return `${major}.${minor}.${patch + 1}`;
    if (bump === "minor") return `${major}.${minor + 1}.0`;
    return `${major + 1}.0.0`;
  }
  // Treat anything else as an explicit target version.
  parseSemver(bump); // throws if invalid
  return bump;
}

function assertCleanWorkingTree() {
  const status = runCapture("git", ["status", "--porcelain"], { cwd: rootDir });
  if (status.length > 0) {
    console.error(
      "Refusing to release: working tree is not clean. Commit or stash your changes first.\n",
    );
    console.error(status);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const dryRun = args.includes("--dry-run");
  const bump = args.find((arg) => !arg.startsWith("-"));
  if (!bump) {
    console.error("Missing version bump argument (patch|minor|major|<version>).\n");
    printHelp();
    process.exit(1);
  }

  if (!dryRun) {
    assertCleanWorkingTree();
  } else {
    console.log("--dry-run: skipping clean-working-tree check, git commit, and git tag.\n");
  }

  const corePkgPath = path.join(packageDirs.core, "package.json");
  const reactPkgPath = path.join(packageDirs.react, "package.json");
  const originalCorePkgText = readFileSync(corePkgPath, "utf8");
  const originalReactPkgText = readFileSync(reactPkgPath, "utf8");
  const corePkg = JSON.parse(originalCorePkgText);
  const reactPkg = JSON.parse(originalReactPkgText);

  const restoreOriginalPackageFiles = () => {
    writeFileSync(corePkgPath, originalCorePkgText);
    writeFileSync(reactPkgPath, originalReactPkgText);
  };

  if (corePkg.version !== reactPkg.version) {
    console.error(
      `Versions are out of sync: core@${corePkg.version} vs react@${reactPkg.version}. ` +
        "Fix this manually before releasing.",
    );
    process.exit(1);
  }

  const nextVersion = computeNextVersion(corePkg.version, bump);
  console.log(`Releasing ${corePkg.version} -> ${nextVersion}${dryRun ? " (dry run)" : ""}\n`);

  console.log("Running test suite, typecheck, and build...");
  run("pnpm", ["test"], { cwd: rootDir });
  run("pnpm", ["typecheck"], { cwd: rootDir });
  run("pnpm", ["build"], { cwd: rootDir });
  console.log("\nAll checks passed.\n");

  corePkg.version = nextVersion;
  reactPkg.version = nextVersion;
  writeJson(corePkgPath, corePkg);
  writeJson(reactPkgPath, reactPkg);
  console.log(`Bumped both package.json files to ${nextVersion}.\n`);

  const publishArgs = [
    "publish",
    "--access",
    "public",
    ...(dryRun ? ["--dry-run", "--no-git-checks"] : []),
  ];

  try {
    console.log(`Publishing @normalized-cache/core@${nextVersion}...`);
    run("pnpm", publishArgs, { cwd: packageDirs.core });

    console.log(`\nPublishing @normalized-cache/react@${nextVersion}...`);
    run("pnpm", publishArgs, { cwd: packageDirs.react });
  } catch (error) {
    console.error(`\nPublish step failed. Restoring the original package.json contents...`);
    restoreOriginalPackageFiles();
    throw error;
  }

  if (dryRun) {
    console.log(
      "\nDry run complete. Restoring the original package.json contents (nothing was really published).",
    );
    restoreOriginalPackageFiles();
    return;
  }

  run("git", ["add", corePkgPath, reactPkgPath], { cwd: rootDir });
  run("git", ["commit", "-m", `Release v${nextVersion}`], { cwd: rootDir });
  run("git", ["tag", `v${nextVersion}`], { cwd: rootDir });

  console.log(`\nDone. Published and tagged v${nextVersion}.`);
  console.log("Don't forget to `git push && git push --tags` if you want this on the remote.");
}

main();
