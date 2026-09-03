'use strict'

/**
 * @atipicial/atipicial-dappkit ships .d.ts that import @atipicial/atipicial-core, but only
 * lists it as a devDependency. Without a real dependency edge, pnpm can't give it a
 * strict symlink, so Node's ancestor-walk resolution falls back to whichever
 * atipicial-core version landed in the shared virtual store slot — ambiguous once more
 * than one atipicial-core major exists in the workspace (see bs-atipicial-legacy's atipicial-core@4.x).
 * Patch the manifest so pnpm resolves it strictly instead of guessing.
 */
function readPackage(packageJson) {
  if (packageJson.name === '@atipicial/atipicial-dappkit') {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      '@atipicial/atipicial-core': '^5.7.0',
    }
  }

  return packageJson
}

module.exports = {
  hooks: {
    readPackage,
  },
}
