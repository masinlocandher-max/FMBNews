import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const newsRoot=path.join(root,'dist','news');
const factRoot=path.join(newsRoot,'fact-check');
const indexPath=path.join(newsRoot,'assets','data','fmb-fact-check','index.json');
const must=(v,m)=>{if(!v)throw new Error(m)};
const read=p=>readFile(p,'utf8');
const exact=/^\d{4}-\d{2}-\d{2}$/;

await access(path.join(factRoot,'index.html'));
await access(indexPath);
for(const name of ['true.svg','fact.svg','misleading.svg','false.svg'])await access(path.join(newsRoot,'assets','images','fact-check',name));

const index=JSON.parse(await read(indexPath));
must(index.length===123,`FMB Fact Check must contain 123 articles; found ${index.length}`);
for(let i=1;i<index.length;i++)must(String(index[i-1].sortKey)>=String(index[i].sortKey),`FMB Fact Check chronology is not newest-first at positions ${i} and ${i+1}`);
const counts=index.reduce((acc,x)=>(acc[x.rating]=(acc[x.rating]||0)+1,acc),{});
for(const [rating,n] of Object.entries({'TRUE':1,'VERIFIED FACT':10,'MISLEADING':48,'FALSE':64}))must(counts[rating]===n,`${rating} count must be ${n}; found ${counts[rating]||0}`);

const archive=await read(path.join(factRoot,'index.html'));
for(const label of ['TRUE','VERIFIED FACT','MISLEADING','FALSE'])must(archive.includes(label),`Fact Check archive missing ${label} tag`);
must(archive.includes('/news/fact-check/'),'Fact Check route missing from archive navigation');
must(!/explained\.ph/i.test(archive),'Original publisher URL/name exposed on Fact Check archive');
must(!/source publication/i.test(archive),'Source-publication wording exposed on Fact Check archive');

let checked=0;
for(const item of index){
  const file=path.join(factRoot,item.slug,'index.html');await access(file);const html=await read(file);checked++;
  must(html.includes('fmb-fact-check-route'),`${item.slug}: Fact Check route identity missing`);
  must(html.includes('aria-label="FMB Fact Check"'),`${item.slug}: Fact Check mast identity missing`);
  must(html.includes('/news/fact-check/'),`${item.slug}: Fact Check navigation missing`);
  must(html.includes('article-hero-image'),`${item.slug}: rating hero image missing`);
  must(/<meta\b[^>]*property=["']og:image["']/i.test(html),`${item.slug}: og:image missing`);
  must(html.includes(item.rating),`${item.slug}: visible rating missing`);
  must(!/explained\.ph/i.test(html),`${item.slug}: original publisher exposed`);
  must(!/source publication/i.test(html),`${item.slug}: source-publication wording exposed`);
  if(!exact.test(item.period))must(!html.includes('"datePublished"'),`${item.slug}: approximate period must not be converted into an exact schema publication date`);
}

console.log(`FMB Fact Check verification passed: ${checked} full articles, newest-first chronology, 1 TRUE / 10 VERIFIED FACT / 48 MISLEADING / 64 FALSE, FMB-owned rating imagery, and no original-publisher links.`);
