/*
👋 Hi! This file was autogenerated by tslint-to-eslint-config.
https://github.com/typescript-eslint/tslint-to-eslint-config

It represents the closest reasonable ESLint configuration to this
project's original TSLint configuration.

We recommend eventually switching this configuration to extend from
the recommended rule sets in typescript-eslint.
https://github.com/typescript-eslint/tslint-to-eslint-config/blob/master/docs/FAQs.md

Happy linting! 💖
*/
module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "ignorePatterns": [],
  "plugins": [
    "eslint-plugin-import",
    "@angular-eslint/eslint-plugin"
  ],
  "overrides": [
    {
      "files": [
        "*.ts"
      ],
      "extends": [
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates"
      ],
      "parser": "@typescript-eslint/parser",
      "parserOptions": {
        "project": [
          "tsconfig.json"
        ],
        "sourceType": "module"
      },
      "plugins": [
        "@typescript-eslint",
        "@typescript-eslint/tslint"
      ],
      "rules": {
        "@angular-eslint/component-class-suffix": "error",
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "app",
            "style": "kebab-case"
          }
        ],
        "@angular-eslint/directive-class-suffix": "error",
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "app",
            "style": "kebab-case"
          }
        ],
        "@angular-eslint/no-host-metadata-property": "error",
        "@angular-eslint/no-input-rename": "error",
        "@angular-eslint/no-inputs-metadata-property": "error",
        "@angular-eslint/no-output-on-prefix": "error",
        "@angular-eslint/no-output-rename": "error",
        "@angular-eslint/no-outputs-metadata-property": "error",
        "@angular-eslint/use-lifecycle-interface": "error",
        "@angular-eslint/use-pipe-transform-interface": "error",
        "@typescript-eslint/comma-dangle": "error",
        "@typescript-eslint/comma-spacing": ["error"],
        "@typescript-eslint/consistent-type-definitions": "error",
        "@typescript-eslint/dot-notation": "off",
        "@typescript-eslint/explicit-member-accessibility": [
          "off",
          {
            "accessibility": "explicit"
          }
        ],
        "@typescript-eslint/func-call-spacing": ["error"],
        "@typescript-eslint/indent": [
          "error",
          2
        ],
        "@typescript-eslint/member-delimiter-style": "off",
        "@typescript-eslint/member-ordering": [
          "error", {
            "default": {
              "memberTypes": [
                "static-field",
                "instance-field",
                "static-method",
                "instance-method"
              ]
            }
          }
        ],
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-duplicate-imports": ["error"],
        "@typescript-eslint/no-extra-semi": ["error"],
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-non-null-assertion": "error",
        "@typescript-eslint/no-shadow": "error",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/quotes": [
          "error",
          "single"
        ],
        "@typescript-eslint/semi": [
          "error",
          "always"
        ],
        "@typescript-eslint/space-infix-ops": ["error"],
        "@typescript-eslint/type-annotation-spacing": "error",
        "@typescript-eslint/unified-signatures": "error",
        "arrow-body-style": "off",
        "brace-style": "off",
        "comma-dangle": "off",
        "comma-spacing": "off",
        "constructor-super": "error",
        "curly": "error",
        "dot-notation": "off",
        "eol-last": "off",
        "eqeqeq": [
          "error",
          "smart"
        ],
        "func-call-spacing": "off",
        "guard-for-in": "off",
        "id-denylist": "off",
        "id-match": "off",
        "import/no-deprecated": "warn",
        "indent": "off",
        "max-len": [
          "error",
          {
            "code": 512
          }
        ],
        "no-bitwise": "error",
        "no-caller": "error",
        "no-console": [
          "error",
          {
            "allow": [
              "warn",
              "dir",
              "timeLog",
              "assert",
              "clear",
              "count",
              "countReset",
              "group",
              "groupEnd",
              "table",
              "dirxml",
              "error",
              "groupCollapsed",
              "Console",
              "profile",
              "profileEnd",
              "timeStamp",
              "context"
            ]
          }
        ],
        "no-debugger": "error",
        "no-duplicate-imports": "off",
        "no-empty": "off",
        "no-empty-function": "off",
        "no-extra-semi": "off",
        "no-eval": "error",
        "no-fallthrough": "error",
        "no-new-wrappers": "error",
        "no-restricted-imports": [
          "error",
          "rxjs/Rx"
        ],
        "no-shadow": "off",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "off",
        "no-unused-expressions": "error",
        "no-unused-labels": "error",
        "no-var": "error",
        "prefer-const": "error",
        "quotes": [
          1,
          "single"
        ],
        "radix": "error",
        "semi": "error",
        "space-infix-ops": "off",
        "spaced-comment": [
          "error",
          "always",
          {
            "markers": [
              "/"
            ]
          }
        ],
        "@typescript-eslint/tslint/config": [
          "error",
          {
            "rules": {
              "import-spacing": true,
              "whitespace": [
                true,
                "check-branch",
                "check-decl",
                "check-operator",
                "check-separator",
                "check-type"
              ]
            }
          }
        ]
      }
    }, {
      "files": [
        "*.html"
      ],
      "extends": [
        "plugin:@angular-eslint/template/recommended"
      ],
      "parser": "@angular-eslint/template-parser",
      "parserOptions": {
        "project": "./tsconfig.app.json",
        "ecmaVersion": 2020,
        "sourceType": "module"
      },
      "plugins": ["@angular-eslint/template"],
      "rules": {
        "@angular-eslint/template/eqeqeq": ["error"],
        "@angular-eslint/template/no-any": ["error"],
        "@angular-eslint/template/no-duplicate-attributes": ["error"]
      }
    }
  ]
};
