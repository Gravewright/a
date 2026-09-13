// Sign a built package with an external Ed25519 PEM. Never copy the key to dist.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,sign} from 'node:crypto';
const index=process.argv.indexOf('--key');if(index<0||!process.argv[index+1])throw new Error('Usage: node scripts/sign.mjs --key /private/publisher.pem');
const manifest=JSON.parse(await readFile('manifest.json','utf8'));
const archive=`dist/gravewright-3d-dice-${manifest.version}.zip`;
const record={id:manifest.id,name:manifest.name,version:manifest.version,description:manifest.description,sdk:manifest.sdk.requires,type:'module',tags:['Dados','3D','Rolagens'],download:`https://github.com/Gravewright/Gravewright-3D-Dice/releases/download/v${manifest.version}/gravewright-3d-dice-${manifest.version}.zip`,sha256:createHash('sha256').update(await readFile(archive)).digest('hex'),keyId:'gravewright-2026'};
const canonical=JSON.stringify(Object.fromEntries(Object.entries(record).sort(([a],[b])=>a.localeCompare(b,'en')))).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
record.signature=sign(null,Buffer.from(canonical),await readFile(process.argv[index+1])).toString('base64');
await writeFile('dist/catalog.json',JSON.stringify([record],null,2)+'\n');console.log('Signed',record.id,record.version,record.sha256);
