import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'
import { fixupPluginRules } from '@eslint/compat'

export default tseslint.config(
  {
    ignores: [
      'node_modules', 'dist', 'build', '.next', 'out',
      'next-env.d.ts',
      'e2e/qa/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        project: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2015
      }
    },
    plugins: {
      react: fixupPluginRules(reactPlugin),
      'react-hooks': fixupPluginRules(reactHooksPlugin),
      import: fixupPluginRules(importPlugin),
      prettier: prettierPlugin
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          project: './tsconfig.json'
        }
      }
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      'prettier/prettier': 'error',

      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'variable',
          types: ['function'],
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'has', 'should', 'need', 'disabled', 'opened', 'show']
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase']
        },
        {
          selector: 'interface',
          format: ['PascalCase']
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase']
        },
        {
          selector: 'enum',
          format: ['UPPER_CASE']
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE']
        }
      ],

      'no-var': 'error',
      'prefer-const': 'error',
      'no-implicit-globals': 'error',

      'max-params': ['error', 3],

      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-template': 'error',
      curly: ['error', 'all'],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
          fixStyle: 'separate-type-imports'
        }
      ],
      'import/no-duplicates': 'error',

      // FSD 딥임포트 금지. views는 page.tsx가 ui/*를 직접 import해서 제외.
      'import/no-internal-modules': [
        'error',
        {
          forbid: ['@/widgets/*/**', '@/features/*/**', '@/entities/*/**']
        }
      ],

      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/shared',
              from: ['./src/entities', './src/features', './src/widgets', './src/views', './src/app'],
              message: 'shared 레이어는 entities/features/widgets/views/app를 import할 수 없습니다.'
            },
            {
              target: './src/entities',
              from: ['./src/features', './src/widgets', './src/views', './src/app'],
              message: 'entities 레이어는 features/widgets/views/app를 import할 수 없습니다.'
            },
            {
              target: './src/features',
              from: ['./src/widgets', './src/views', './src/app'],
              message: 'features 레이어는 widgets/views/app를 import할 수 없습니다.'
            },
            {
              target: './src/widgets',
              from: ['./src/views', './src/app'],
              message: 'widgets 레이어는 views/app를 import할 수 없습니다.'
            },
            {
              target: './src/views',
              from: ['./src/app'],
              message: 'views 레이어는 app를 import할 수 없습니다.'
            }
          ]
        }
      ],

      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration:not(ExportDefaultDeclaration > FunctionDeclaration)',
          message: '함수 선언식 대신 화살표 함수를 사용해주세요. (const fn = () => {})'
        },
        {
          selector: 'ExportAllDeclaration',
          message: "export * 는 사용하지 않습니다. import 후 named export를 사용해주세요. (import { x } from '...'; export { x };)"
        },
        {
          selector: 'BinaryExpression[operator="=="]',
          message: '== 대신 === 을 사용해주세요. '
        },
        {
          selector: 'BinaryExpression[operator="!="]',
          message: '!= 대신 !== 을 사용해주세요.'
        },
        {
          selector: 'VariableDeclaration[kind="var"]',
          message: 'var는 사용하지 않습니다. const 또는 let을 사용해주세요.'
        },
        {
          selector:
            'BinaryExpression[operator="+"][left.type="Literal"][left.value=type(string)][right.type!="Literal"], BinaryExpression[operator="+"][right.type="Literal"][right.value=type(string)][left.type!="Literal"]',
          message: '문자열 연결에 + 연산자 대신 템플릿 리터럴을 사용해주세요. (예: 안녕 ${name})'
        },
        {
          selector: 'AssignmentExpression[left.type="MemberExpression"][left.object.name="window"]',
          message: 'window.xxx 전역변수 할당은 사용하지 않습니다. 모듈 스코프 내에서 변수를 선언해주세요.'
        }
      ],

      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'util',
              importNames: ['isArray'],
              message: 'util.isArray 대신 Array.isArray를 사용해주세요.'
            },
            {
              name: 'lodash',
              message: 'lodash 전체를 import하지 말고 개별 함수를 import해주세요. (예: import debounce from "lodash/debounce")'
            },
            {
              name: 'react',
              importNames: ['default'],
              message: 'React는 default import 없이 사용할 수 있습니다. (React 17+ JSX transform)'
            }
          ]
        }
      ],

      'no-implicit-coercion': 'error',
      'no-undef': 'off',
      indent: 'off',
      '@typescript-eslint/indent': 'off',
      semi: 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-extra-boolean-cast': 'off',
      'getter-return': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-parameter-properties': 'off',
      'no-async-promise-executor': 'warn',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      '@typescript-eslint/no-restricted-types': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'public-static-field',
            'private-static-field',
            'public-instance-field',
            'private-instance-field',
            'public-constructor',
            'private-constructor',
            'public-instance-method',
            'private-instance-method'
          ]
        }
      ],
      'no-warning-comments': ['warn', { terms: ['TODO', 'FIXME', 'XXX', 'BUG'], location: 'anywhere' }],
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/no-unknown-property': ['error', { ignore: ['css'] }]
    }
  },
  {
    // 스토리 export 이름이 사이드바 이름이라 PascalCase를 허용한다.
    files: ['**/*.stories.ts', '**/*.stories.tsx'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'variable',
          types: ['boolean'],
          format: ['PascalCase'],
          prefix: ['is', 'has', 'should', 'need', 'disabled', 'opened', 'show']
        }
      ]
    }
  },
  prettierConfig
)
