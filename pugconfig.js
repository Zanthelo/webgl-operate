/**
 * This custom script is used to build/copy website sources for distribution:
 * - copy specific assets such as style sheets or scripts (either 3rd party or custom ones)
 * - compile specific pug templates and render to dist path
 */

const watch = process.argv.indexOf('--watch') > 1;

const fs = require('fs');
const path = require('path');
const pug = require('pug');

const copy = require('./copy.js');

const websiteDir = './website';
const buildDir = './build';

const entries = ['index.pug', 'about.pug'];

const assets = [
    [websiteDir, buildDir, ['css/*.css', 'js/*.js', 'img/*.{svg,png}', 'fonts/*', '*.{svg,png,ico,xml,json}'], [], false],
    ['./source', buildDir, ['data/{colorbrewer,smithwalt}.json'], [], false],
    ['./node_modules/rxjs/bundles/', `${buildDir}/js`, ['rxjs.umd.min.js'], [], false],
    ['./source/data/', `${buildDir}/data`, ['*'], [], false],
];


var build_pending = false;
function build() {

    assets.forEach((asset) => copy(asset[0], asset[1], asset[2], asset[3], asset[4]));

    entries.forEach((entry) => {
        const src = path.join(websiteDir, entry);
        const dst = path.join(buildDir, path.basename(entry, path.extname(entry)) + '.html');

        if (!fs.existsSync(src)) {
            console.log('skipped:', entry);
            return;
        }

        const html = pug.renderFile(src);
        fs.writeFileSync(dst, html);

        console.log('emitted:', dst);
    });

    build_pending = false;
}


build(); // trigger initial build

if (watch) {
    fs.watch(websiteDir, { recursive: true }, function () {
        if (build_pending) {
            return;
        }
        build_pending = true;
        setTimeout(build, 100);
    });
}
