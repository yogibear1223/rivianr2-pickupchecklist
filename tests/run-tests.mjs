import { createRequire } from 'node:module';
import { realpathSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const require=createRequire(realpathSync('./node_modules/drizzle-kit/bin.cjs'));
const {build}=require('esbuild');
mkdirSync('.sites-runtime/tests',{recursive:true});
for(const test of ['core','api']) {
 const output='.sites-runtime/tests/'+test+'.mjs';
 await build({entryPoints:['tests/'+test+'.test.ts'],outfile:output,bundle:true,platform:'node',format:'esm',alias:{'@/lib/identity':'./tests/api-fixture.ts','@/db':'./tests/api-fixture.ts','@/lib/model':'./lib/model.ts'},logLevel:'error'});
 const result=spawnSync(process.execPath,[output],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
