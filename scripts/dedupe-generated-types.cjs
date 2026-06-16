#!/usr/bin/env node
/*
 * Post-codegen dedupe for src/__generated__/graphql.ts.
 *
 * graphql-codegen (typescript@6 + typescript-operations@6) emits some enums
 * (e.g. `SortOrder`, used as an operation variable) as a top-level
 * `export type X = ...;` from BOTH the `typescript` and `typescript-operations`
 * plugins. The duplicate declaration is a valid TS-with-@ts-nocheck file for
 * `tsc`, but oxc/esbuild (vitest + vite build) fail to parse it with
 * "Identifier `X` has already been declared".
 *
 * This script removes duplicate top-level `export type <Name> = ...;` blocks,
 * keeping the first occurrence. It is wired into codegen via the
 * `hooks.afterOneFileWrite` hook so regeneration always yields a parseable file.
 */
'use strict'

const fs = require('fs')

function dedupeExportedTypes(source) {
  // Match top-level `export type Name =` ... up to the terminating `;`.
  const pattern = /^export type (\w+) =[\s\S]*?;\n/gm
  const seen = new Set()
  return source.replace(pattern, (block, name) => {
    if (seen.has(name)) {
      return '' // drop the duplicate declaration
    }
    seen.add(name)
    return block
  })
}

function main() {
  const files = process.argv.slice(2)
  if (files.length === 0) {
    files.push('src/__generated__/graphql.ts')
  }
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    const original = fs.readFileSync(file, 'utf8')
    const deduped = dedupeExportedTypes(original)
    if (deduped !== original) {
      fs.writeFileSync(file, deduped)
      // eslint-disable-next-line no-console
      console.log(`[dedupe-generated-types] removed duplicate type declarations in ${file}`)
    }
  }
}

main()
