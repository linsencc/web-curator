import {cp,mkdir,readFile,readdir} from 'node:fs/promises';
const source=new URL('../extension/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('manifest.json',source),'utf8'));
const target=new URL('../dist/web-curator-'+manifest.version+'/',import.meta.url);
await mkdir(target,{recursive:true});
for(const entry of await readdir(source)) await cp(new URL(entry,source),new URL(entry,target),{recursive:true});
console.log('Release directory:',decodeURIComponent(target.pathname));
