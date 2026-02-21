import { existsSync } from 'fs'
import type { CodegenConfig } from '@graphql-codegen/cli'

const NPM_SCHEMA = 'node_modules/@stuartshay/otel-graphql-types/schema.graphql'
const LOCAL_SCHEMA = '../otel-data-gateway/src/schema/schema.graphql'

const schema =
  process.env.GRAPHQL_SCHEMA_PATH ??
  (existsSync(NPM_SCHEMA) ? NPM_SCHEMA : LOCAL_SCHEMA)

const config: CodegenConfig = {
  schema,
  documents: 'src/graphql/**/*.ts',
  generates: {
    'src/__generated__/graphql.ts': {
      plugins: [
        { add: { content: '/* eslint-disable */\n// @ts-nocheck' } },
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
        useTypeImports: true,
        enumsAsTypes: true,
        apolloReactHooksImportFrom: '@apollo/client/react',
        apolloReactCommonImportFrom: '@apollo/client/react',
        scalars: {
          DateTime: 'string',
          JSON: 'Record<string, unknown>',
        },
      },
    },
  },
}

export default config
