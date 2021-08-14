# #!/bin/bash
rimraf dist/lib
cross-env NODE_ENV=production rollup -c
cp README.md dist/lib
cp package.json dist/lib
node -e "let pkg=require('./dist/lib/package.json'); pkg.sideEffects=false; require('fs').writeFileSync('./dist/lib/package.json', JSON.stringify(pkg, null, 2));"
cp LICENSE.md dist/lib