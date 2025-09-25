import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
      extends: ['next/core-web-vitals', 'next/typescript'],
  }),
  {
    rules: {
      // Disable strict TypeScript rules that are too restrictive for this project
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn', // Keep as warning instead of error
      '@typescript-eslint/no-require-imports': 'off', // Allow require() for Node.js files
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      
      // Disable React strict rules that cause issues
      'react/no-unescaped-entities': 'off',
      
      // Disable Next.js optimization warnings for now
      '@next/next/no-img-element': 'off',
    },
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".next/types/**", // Explicitly ignore generated types
      "**/.next/**", // Additional pattern to ignore .next directory
    ],
  },
]

export default eslintConfig;
