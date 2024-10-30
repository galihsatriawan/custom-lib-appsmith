
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser'
import commonjs from '@rollup/plugin-commonjs';
import path from 'path';
import fs from 'fs';
import replace from '@rollup/plugin-replace';

const baseDir = path.resolve(__dirname, '.');

// Dynamically generate the Rollup configuration for each library
const libraryFolders = fs.readdirSync(path.join(baseDir, 'libraries')).filter(file => {
  return fs.statSync(path.join(baseDir, 'libraries', file)).isDirectory();
});

const outputConfig = libraryFolders.map(folder => {
  return {
    input: path.join(baseDir, `libraries/${folder}/index.js`),
    output: {
      file: path.join(baseDir, `dist/${folder}.umd.js`),
      format: 'umd',
      name: folder.replace(/-\w/g, m => m[1].toUpperCase()), // Convert kebab-case to CamelCase
      globals: {
        // Define globals here if your libraries depend on external modules
      }
    },
    plugins: [
      resolve(),
      terser(),
      commonjs({
        include: /node_modules/,
      }),
      replace(),
    ],
    external: [
      // Add external dependencies here if needed
    ]
  };
});
export default outputConfig;