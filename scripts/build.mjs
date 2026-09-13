import {build} from 'esbuild';
import {mkdir,rm,cp,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');process.chdir(root);
await rm('dist/package',{recursive:true,force:true});await mkdir('dist/package',{recursive:true});
await build({entryPoints:['src/main.js'],outfile:'dist/package/main.js',bundle:true,format:'esm',target:'es2022',legalComments:'inline'});
await build({entryPoints:['src/worker.js'],outfile:'dist/package/physics-worker.js',bundle:true,format:'iife',target:'es2022',legalComments:'inline'});
for(const file of ['manifest.json','styles.css','assets','LICENSE.md','LICENSES','THIRD_PARTY_NOTICES.md','VALIDATION.md','README.md','src','scripts','package.json','package-lock.json']) await cp(file,'dist/package/'+file,{recursive:true});
for(const lib of ['three','cannon-es'])await cp('node_modules/'+lib+'/LICENSE','dist/package/LICENSES/'+lib+'.txt');
const version=JSON.parse(await readFile('manifest.json')).version;
const py=spawnSync(process.env.PYTHON || (process.platform==='win32'?'python':'python3'),['-c',`
import pathlib,zipfile,hashlib
root=pathlib.Path('dist/package');target=pathlib.Path('dist/gravewright-3d-dice-${version}.zip')
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  if not p.is_file():continue
  info=zipfile.ZipInfo(p.relative_to(root).as_posix(),(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
  z.writestr(info,p.read_bytes())
target.with_suffix('.zip.sha256').write_text(hashlib.sha256(target.read_bytes()).hexdigest()+'  '+target.name+'\\n')
print(target)
`],{stdio:'inherit'});if(py.status!==0)process.exit(py.status??1);
