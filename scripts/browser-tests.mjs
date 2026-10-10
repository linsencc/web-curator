import {mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
for(const file of ['browser-check.mjs','dynamic-check.mjs','initial-fill-check.mjs']) {
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('../tests/'+file,import.meta.url))],{stdio:'inherit',env:process.env});
 if(result.status!==0) process.exit(result.status||1);
}
