import multiEntry from '@rollup/plugin-multi-entry';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import path from 'path';
import fs from 'fs';

// Dynamically generate the input configuration for Rollup.
// This is going to parse the folders in the `libraries` directory.
const libraryFolders = fs.readdirSync('libraries').filter(function (file) {
  return fs.statSync(path.join('libraries', file)).isDirectory();
});

// We expect that each library will have a single `index.js` file that will be processed.
const inputConfig = libraryFolders.map(folder => `libraries/${folder}/index.js`);

// Generate output configuration for each library
const outputConfig = libraryFolders.map(folder => ({
  input: `libraries/${folder}/index.js`,
  output: {
    file: `dist/${folder}.umd.js`,
    format: 'umd',
    name: folder.replace(/-\w/g, m => m[1].toUpperCase()), // Convert kebab-case to CamelCase
  },
  plugins: [
    multiEntry(),
    resolve(),
    terser(),
  ]
}));

export default outputConfig;