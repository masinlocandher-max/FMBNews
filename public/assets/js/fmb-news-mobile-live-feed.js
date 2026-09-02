(()=>{
  'use strict';
  if(!window.matchMedia('(max-width:699px)').matches)return;

  const root=document.querySelector('[data-fmb-mobile-home]');
  if(!root)return;

  const SUPABASE_URL='https://wjnavdpppnhxbuydkrkd.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_bpdFntTHbHmxsG4L0PtcCw_5dJ8gpr8';
  const FALLBACK_IMAGE='/news/assets/images/news/fmb-news-editorial-fallback.svg';
  const API=`${SUPABASE_URL}/rest/v1/news_articles`;

  const fmtTime=value=>{
    if(!value)return'';
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return'';
    return new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit',hour12:true}).format(d)+' PHT';
  };

  const storyHref=story=>story.canonical_path||`/news/read/${encodeURIComponent(story.slug)}/`;
  const imageFor=story=>String(story.image_url||'').trim()||FALLBACK_IMAGE;
  const isMaterialUpdate=story=>{
    const p=Date.parse(story.published_at||'');
    const u=Date.parse(story.updated_at||'');
    return Number.isFinite(p)&&Number.isFinite(u)&&u-p>10*60*1000;
  };
  const displayTime=story=>isMaterialUpdate(story)?story.updated_at:story.published_at;
  const readMinutes=story=>{
    const sections=Array.isArray(story.content_json?.sections)?story.content_json.sections:[];
    const words=sections.flatMap(section=>Array.isArray(section.paragraphs)?section.paragraphs:[]).join(' ').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1,Math.ceil((words||220)/220));
  };

  function safeImage(img,story){
    img.src=imageFor(story);
    img.alt=story.image_metadata?.alt||story.title||'FMB News';
    img.addEventListener('error',()=>{if(img.dataset.fmbFallback==='true')return;img.dataset.fmbFallback='true';img.src=FALLBACK_IMAGE},{once:true});
  }

  function metaNode(story){
    const meta=document.createElement('div');meta.className='fmb-app-story-meta';
    const category=document.createElement('span');category.textContent=story.region||story.category||story.kicker||'News';
    const dot1=document.createElement('span');dot1.textContent='·';
    const time=document.createElement('time');time.dateTime=displayTime(story)||'';time.textContent=`${isMaterialUpdate(story)?'Updated ':''}${fmtTime(displayTime(story))}`;
    const dot2=document.createElement('span');dot2.textContent='·';
    const read=document.createElement('span');read.textContent=`${readMinutes(story)} min`;
    meta.append(category,dot1,time,dot2,read);return meta;
  }

  function storyRow(story){
    const link=document.createElement('a');link.className='fmb-app-story-row';link.href=storyHref(story);
    const copy=document.createElement('div');copy.className='fmb-app-story-copy';copy.appendChild(metaNode(story));
    const title=document.createElement('h3');title.textContent=story.title||'FMB News';copy.appendChild(title);
    const img=document.createElement('img');img.loading='lazy';safeImage(img,story);
    link.append(copy,img);return link;
  }

  function renderLead(story){
    const link=root.querySelector('.fmb-app-lead-media');if(!link)return;
    link.href=storyHref(story);
    const img=link.querySelector('img');if(img)safeImage(img,story);
    const copy=link.querySelector('.fmb-app-lead-copy');if(!copy)return;
    const oldMeta=copy.querySelector('.fmb-app-story-meta');if(oldMeta)oldMeta.replaceWith(metaNode(story));
    const h2=copy.querySelector('h2');if(h2)h2.textContent=story.title||'FMB News';
    const p=copy.querySelector('p');if(p)p.textContent=story.deck||story.summary||'';
  }

  function renderTicker(stories){
    const ticker=root.querySelector('.fmb-approved-hero-ticker');
    if(!ticker||!stories.length)return;
    ticker.href=storyHref(stories[0]);
    const groups=ticker.querySelectorAll('.fmb-approved-hero-ticker-group');
    for(const group of groups){
      group.replaceChildren(...stories.slice(0,4).map(story=>{const item=document.createElement('i');item.textContent=story.title||'FMB News';return item}));
    }
  }

  function renderStories(stories){
    if(!Array.isArray(stories)||!stories.length)return;
    const unique=[];const seen=new Set();
    for(const story of stories){if(!story?.slug||seen.has(story.slug))continue;seen.add(story.slug);unique.push(story)}
    if(!unique.length)return;
    renderLead(unique[0]);
    renderTicker(unique);
    const list=root.querySelector('.fmb-app-story-list');
    if(list)list.replaceChildren(...unique.slice(1,6).map(storyRow));
    root.dataset.fmbLiveStories='true';
    root.dataset.fmbLiveStoryUpdatedAt=new Date().toISOString();
  }

  async function hydrate(){
    try{
      const fields=['slug','canonical_path','title','summary','deck','category','region','kicker','image_url','image_metadata','published_at','updated_at','content_json'].join(',');
      const query=`select=${fields}&status=eq.published&order=updated_at.desc.nullslast,published_at.desc&limit=6`;
      const response=await fetch(`${API}?${query}`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Accept:'application/json'},cache:'no-store'});
      if(!response.ok)throw new Error(`FMB live feed request failed (${response.status})`);
      const stories=await response.json();
      renderStories(stories);
    }catch(error){
      console.warn('FMB News live mobile feed fell back to the deployed static snapshot.',error);
    }
  }

  hydrate();
  window.setInterval(hydrate,5*60*1000);
})();
