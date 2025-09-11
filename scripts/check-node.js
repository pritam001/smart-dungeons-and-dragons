#!/usr/bin/env node
/**
 * Ensures we are running the expected Node.js version before building.
 * Reads the version from package.json (engines.node) and compares to process.version.
 * Exits with code 1 and a helpful message if mismatch.
 */
const { engines } = require("../package.json");
const semver = require("semver");

function fail(msg) {
    console.error("\n[check-node] " + msg + "\n");
    process.exit(1);
}

if (!engines || !engines.node) {
    fail("No engines.node field found in package.json");
}

const requiredRange = engines.node; // e.g. ">=24.7.0"
const current = process.version.replace("v", "");

if (!semver.valid(current)) {
    fail(`Current Node version (${process.version}) is not a valid semver string.`);
}

if (!semver.validRange(requiredRange)) {
    fail(`Engines range (${requiredRange}) is not a valid semver range.`);
}

if (!semver.satisfies(current, requiredRange)) {
    fail(
        `Node ${current} does not satisfy required range ${requiredRange}. Please switch (e.g. via Volta) before building.`,
    );
}

console.log(`[check-node] Node ${current} satisfies required range ${requiredRange}.`);
