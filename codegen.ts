import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  // TODO: Switch to npm package path once @stuartshay/otel-graphql-types is published:
  // schema: 'node_modules/@stuartshay/otel-graphql-types/schema.graphql',
  schema: '../otel-data-gateway/src/schema/schema.graphql',
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
