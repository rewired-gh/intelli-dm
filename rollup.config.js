import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'node_modules/jointjs/joint.mjs',
  output: {
    file: 'src/plugins/jointjsESM.js',
    format: 'es',
    freeze: false, // this is key to preventing everything from being constant
  },
  plugins: [
    commonjs({
      // search for files other than .js files (must already
      // be transpiled by a previous plugin!)
      extensions: ['.js', '.mjs'], // Default: [ '.js' ]

      // if true then uses of `global` won't be dealt with by this plugin
      ignoreGlobal: false, // Default: false

      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: false, // Default: true
    }),
  ],
};
