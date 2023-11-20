const minimist = require('minimist')
const { resolve } = require('path')
const { build } = require('esbuild')

const args = minimist(process.argv.slice(2))

const format = args.f || 'global'
const target = args._[0] || 'reactivity'
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))

const formatMap = {
    'global': 'iife',
    'esm-bundler': 'esm',
    'cjs': 'cjs'
}

const outputFormat = formatMap[format] || 'iife'
const outFile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)

build({
    entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
    outfile: outFile,
    bundle: true,
    sourcemap: true,
    format: outputFormat,
    globalName: pkg.buildOptions.name,
    platform: format === 'cjs' ? 'node' : 'browser',
    watch: {
        onRebuild(error) {
            if (!error) {
                console.log('rebuild');
            }
        }
    }
}).then(() => {
    console.log('watching');
})