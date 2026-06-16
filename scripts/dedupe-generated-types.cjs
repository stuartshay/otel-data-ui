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
 * keeping the first occurrence. It scans line-by-line and tracks bracket depth
 * (`{}`, `()`, `[]`) so the end of a type alias is only recognised at a line
 * ending in `;` while at depth 0 — object/array/union type bodies (whose
 * property lines also end in `;`) are handled correctly.
 *
 * It is wired into codegen via the `hooks.afterOneFileWrite` hook so
 * regeneration always yields a parseable file.
 */
'use strict'

const fs = require('fs')

const START_RE = /^export type (\w+) =/

function bracketDelta(line) {
  let delta = 0
  for (const ch of line) {
    if (ch === '{' || ch === '(' || ch === '[') delta++
    else if (ch === '}' || ch === ')' || ch === ']') delta--
  }
  return delta
}

function dedupeExportedTypes(source) {
  const lines = source.split('\n')
  const out = []
  const seen = new Set()
  let i = 0

  while (i < lines.length) {
    const match = lines[i].match(START_RE)
    if (!match) {
      out.push(lines[i])
      i++
      continue
    }

    // Collect the full `export type Name = ...;` block. The alias ends at the
    // first line ending in `;` while bracket depth has returned to 0.
    const name = match[1]
    const block = []
    let depth = 0
    let j = i
    for (; j < lines.length; j++) {
      const line = lines[j]
      block.push(line)
      depth += bracketDelta(line)
      if (depth <= 0 && /;\s*$/.test(line)) break
    }

    if (seen.has(name)) {
      // Drop the duplicate declaration entirely.
    } else {
      seen.add(name)
      out.push(...block)
    }
    i = j + 1
  }

  return out.join('\n')
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
