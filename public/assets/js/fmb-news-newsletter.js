(()=>{
  const config=window.FMB_CONFIG||{};
  const url=config.SUPABASE_URL;
  const key=config.SUPABASE_ANON_KEY;
  const forms=[...document.querySelectorAll('[data-fmb-newsletter-form]')];
  if(!forms.length)return;
  const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const setState=(form,message,state='idle')=>{const status=form.querySelector('[data-fmb-newsletter-status]');if(status){status.textContent=message;status.dataset.state=state;}};
  for(const form of forms){
    form.addEventListener('submit',async(event)=>{
      event.preventDefault();
      const input=form.querySelector('input[type="email"]');
      const consent=form.querySelector('[data-fmb-newsletter-consent]');
      const button=form.querySelector('button[type="submit"]');
      const honeypot=form.querySelector('[data-fmb-newsletter-honeypot]');
      const email=(input?.value||'').trim().toLowerCase();
      if(honeypot?.value){setState(form,'Thank you.','success');return;}
      if(!emailPattern.test(email)){setState(form,'Enter a valid email address.','error');input?.focus();return;}
      if(consent&&!consent.checked){setState(form,'Please confirm that you agree to receive the FMB News Daily Brief.','error');consent.focus();return;}
      if(!url||!key){setState(form,'Newsletter signup is temporarily unavailable.','error');return;}
      button?.setAttribute('disabled','');form.setAttribute('aria-busy','true');setState(form,'Subscribing…','loading');
      try{
        const response=await fetch(`${url}/rest/v1/fmb_news_subscribers`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({email,status:'subscribed',source:'fmb-news-web',landing_path:location.pathname,user_agent:navigator.userAgent.slice(0,500)})});
        if(response.ok){input.value='';if(consent)consent.checked=false;setState(form,'You’re subscribed to the FMB News Daily Brief.','success');return;}
        if(response.status===409){setState(form,'This email is already subscribed.','success');return;}
        throw new Error(`Subscription failed (${response.status})`);
      }catch(error){console.error('FMB News newsletter signup failed',error);setState(form,'We couldn’t subscribe you right now. Please try again.','error');}
      finally{button?.removeAttribute('disabled');form.removeAttribute('aria-busy');}
    });
  }
})();
