#!/usr/bin/env node

import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const packageJsonPath = resolve(rootDir, "package.json")
const initialVersion = "0.1.0"
const bumpType = process.argv[2] ?? "patch"
const supportedBumps = new Set(["patch", "minor", "major"])

function fail(message) {
  console.error(`\n${message}`)
  process.exit(1)
}

function run(command, args) {
  console.log(`\n$ ${[command, ...args].join(" ")}`)
  execFileSync(command, args, { cwd: rootDir, stdio: "inherit" })
}

function output(command, args) {
  return execFileSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim()
}

function tryOutput(command, args) {
  try {
    return output(command, args)
  } catch {
    return ""
  }
}

function ensureCleanWorkingTree() {
  const status = output("git", ["status", "--porcelain"])

  if (status) {
    fail(
      [
        "Working tree is not clean. Commit or stash changes before releasing.",
        "",
        status,
      ].join("\n")
    )
  }
}

function currentBranch() {
  const branch = output("git", ["branch", "--show-current"])

  if (!branch) {
    fail("Cannot release from a detached HEAD.")
  }

  return branch
}

function readPackageJson() {
  return JSON.parse(readFileSync(packageJsonPath, "utf8"))
}

function writePackageJson(packageJson) {
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)

  if (!match) {
    fail(`Invalid package version "${version}". Expected semver like 0.1.0.`)
  }

  return match.slice(1).map(Number)
}

function bumpVersion(version, type) {
  const [major, minor, patch] = parseVersion(version)

  if (type === "major") {
    return `${major + 1}.0.0`
  }

  if (type === "minor") {
    return `${major}.${minor + 1}.0`
  }

  return `${major}.${minor}.${patch + 1}`
}

function tagExists(tagName) {
  if (output("git", ["tag", "--list", tagName]) === tagName) {
    return true
  }

  return Boolean(
    tryOutput("git", ["ls-remote", "--tags", "origin", `refs/tags/${tagName}`])
  )
}

if (!supportedBumps.has(bumpType)) {
  fail(`Unsupported bump "${bumpType}". Use patch, minor, or major.`)
}

ensureCleanWorkingTree()

const branch = currentBranch()
const packageJson = readPackageJson()
const packageVersion = packageJson.version ?? initialVersion

parseVersion(packageVersion)

let releaseVersion = packageVersion

while (tagExists(`v${releaseVersion}`)) {
  releaseVersion = bumpVersion(releaseVersion, bumpType)
}

const releaseTag = `v${releaseVersion}`

console.log(`Preparing ${releaseTag}`)

run("pnpm", ["run", "typecheck"])
run("pnpm", ["run", "build"])

ensureCleanWorkingTree()

if (packageJson.version !== releaseVersion) {
  packageJson.version = releaseVersion
  writePackageJson(packageJson)
  run("git", ["add", "package.json"])
  run("git", ["commit", "-m", `chore: release ${releaseTag}`])
}

run("git", ["tag", "-a", releaseTag, "-m", `Release ${releaseTag}`])
run("git", ["push", "origin", branch])
run("git", ["push", "origin", releaseTag])

console.log(
  `\nPublished ${releaseTag}. GitHub Actions will create the release.`
)
