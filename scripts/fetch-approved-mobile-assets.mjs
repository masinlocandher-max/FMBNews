import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'dist','news','assets','images','mobile');
await mkdir(outDir,{recursive:true});

const assets=[
  {
    name:'FMB approved Philippines hero',
    id:'14fKTwMW0qnVi36eVSAjSBr05_VZgq4kf',
    file:'fmb-mobile-hero.jpg',
    width:2200
  },
  {
    name:'FMB Daily Brief mug',
    id:'1KUeapU5-UNZocnOPWRze220hlm5BYg_h',
    file:'fmb-daily-brief-mug.jpg',
    width:1400
  }
];

for(const asset of assets){
  const url=`https://drive.google.com/thumbnail?id=${encodeURIComponent(asset.id)}&sz=w${asset.width}`;
  const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'FMBNewsBuild/1.0'}});
  if(!response.ok)throw new Error(`${asset.name} download failed: HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<20_000)throw new Error(`${asset.name} download looks incomplete (${bytes.length} bytes)`);
  await writeFile(path.join(outDir,asset.file),bytes);
  console.log(`Localized ${asset.name}: ${asset.file} (${bytes.length} bytes).`);
}
