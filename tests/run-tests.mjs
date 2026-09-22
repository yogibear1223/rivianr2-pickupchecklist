import { createRequire } from 'node:module';
import { realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const require=createRequire(realpathSync('./node_modules/drizzle-kit/bin.cjs'));
const {build}=require('esbuild');
mkdirSync('.sites-runtime/tests',{recursive:true});
writeFileSync('.sites-runtime/tests/pdf-worker-url.mjs', 'export default ' + JSON.stringify(pathToFileURL(realpathSync('node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs')).href));
for(const test of ['core','api','import','pdf-import','plan']) {
 const output='.sites-runtime/tests/'+test+'.mjs';
 await build({entryPoints:['tests/'+test+'.test.ts'],outfile:output,bundle:true,platform:'node',format:'esm',external:['pdfjs-dist','jspdf'],alias:{'@/lib/identity':'./tests/api-fixture.ts','@/db':'./tests/api-fixture.ts','@/lib/model':'./lib/model.ts','pdfjs-dist/legacy/build/pdf.worker.min.mjs?url':'./.sites-runtime/tests/pdf-worker-url.mjs'},logLevel:'error'});
 const result=spawnSync(process.execPath,[output],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
