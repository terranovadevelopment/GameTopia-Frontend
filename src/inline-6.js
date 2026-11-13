
  (function(){
    const fields=document.getElementById('densityFields'),panel=document.getElementById('mapSetupPanel');
    const names=[['cities','Cities'],['forest','Forests'],['hills','Rough'],['mountains','Mountains'],['swamp','Swamps'],['lakes','Lakes'],['rivers','Rivers'],['streams','Streams']];
    for(const [key,label] of names){const wrapper=document.createElement('label');wrapper.style.cssText='display:flex;flex-direction:column;gap:4px;font-size:13px';wrapper.textContent=label;const sel=document.createElement('select');sel.dataset.density=key;sel.style.cssText='padding:7px;background:#293d4b;color:white;border:1px solid #688293;border-radius:4px';for(const [v,text] of (key==='cities'?[['low','Low'],['normal','Normal'],['high','High']]:[['off','None'],['low','Low'],['normal','Normal'],['high','High']])){const option=document.createElement('option');option.value=v;option.textContent=text;sel.appendChild(option);}sel.value=(window.ARMAGEDDON_DENSITY||{})[key]||'normal';wrapper.appendChild(sel);fields.appendChild(wrapper);}
    document.getElementById('mapSize').value=window.ARMAGEDDON_SETUP?.size||'medium';
    document.getElementById('deployment').value=window.ARMAGEDDON_SETUP?.deployment||'mobilized';
    const seedControl=document.getElementById('mapSeed');
    const existing=new URLSearchParams(location.search);
    seedControl.value=existing.get('seed')||String(Math.floor(Math.random()*4294967295)).padStart(10,'0');
    seedControl.addEventListener('click',async()=>{seedControl.select();try{await navigator.clipboard.writeText(seedControl.value);}catch(e){document.execCommand('copy');}seedControl.title='Copied: '+seedControl.value;});
    for(const id of ['playerSide','blueUnits','redUnits','blueRP','redRP','blueReplacementRate','redReplacementRate','blueCityRP','redCityRP']){if(existing.has(id))document.getElementById(id).value=existing.get(id);}
    document.getElementById('unitSymbolStyle').value=existing.get('unitSymbolStyle')==='silhouettes'?'silhouettes':'nato';
    const sizeControl=document.getElementById('mapSize'),preview=document.getElementById('forcePreview');
    const standardDimensions={small:[30,20],medium:[42,28],large:[60,40],huge:[72,48]};
    const customWidth=document.getElementById('customWidth');
    const customHeight=document.getElementById('customHeight');
    function syncMapDimensions(){
      const [width,height]=standardDimensions[sizeControl.value]||standardDimensions.medium;
      customWidth.value=width;
      customHeight.value=height;
    }
    // Show actual custom dimensions for an existing custom game, or standard dimensions for the preset.
    const initialWidth=Number(existing.get('customWidth'));
    const initialHeight=Number(existing.get('customHeight'));
    if(Number.isInteger(initialWidth)&&initialWidth>=12&&initialWidth<=200&&Number.isInteger(initialHeight)&&initialHeight>=12&&initialHeight<=150){
      customWidth.value=initialWidth;customHeight.value=initialHeight;
    }else syncMapDimensions();
    sizeControl.addEventListener('change',syncMapDimensions);
    function updateForces(){
      const scale={small:.5,medium:1,large:2,huge:3}[sizeControl.value]||1;
      const types=[['Infantry',16],['Motorized',4],['Mechanized',4],['Armored',4]];
      const counts={};
      for(const side of ['Blue','Red']){
        const pct=Math.max(0,Number(document.getElementById(side==='Blue'?'blueUnits':'redUnits').value)||0)/100;
        counts[side]=types.map(([,base])=>Math.round(base*scale*pct));
      }
      const tbody=document.getElementById('setupForceRows');
      if(tbody){tbody.replaceChildren();types.forEach(([type],i)=>{const tr=document.createElement('tr');for(const value of [type,counts.Blue[i],counts.Red[i]]){const td=document.createElement('td');td.textContent=String(value);tr.appendChild(td);}tbody.appendChild(tr);});}
      const total=side=>counts[side].reduce((sum,n)=>sum+n,0);
      const totalLabel=document.getElementById('setupForceTotal');
      if(totalLabel)totalLabel.textContent=`${total('Blue')} Blue / ${total('Red')} Red`;
      if(preview)preview.textContent=`Map ×${scale}; Bluenstein ${total('Blue')} divisions, Redonia ${total('Red')} divisions.`;
    }
    sizeControl.addEventListener('change',updateForces);for(const id of ['blueUnits','redUnits'])document.getElementById(id).addEventListener('input',updateForces);updateForces();
    const stage=document.getElementById('storyStage'),card=document.getElementById('storyCard');
    const editableIds=['customWidth','customHeight','mapSize','deployment','playerSide','blueUnits','redUnits','blueRP','redRP','blueReplacementRate','redReplacementRate','blueCityRP','redCityRP','unitSymbolStyle'];
    let previousSettings=null;
    function openSetup(){
      if(document.body.classList.contains('pre-game'))return;
      previousSettings=new Map(editableIds.map(id=>[id,document.getElementById(id).value]));
      stage.replaceChildren(panel,musicSwitch);stage.className='setup';stage.hidden=false;window.ARMAGEDDON_MARCH?.selectPage(3);
      card.hidden=true;panel.hidden=false;
      for(const el of panel.querySelectorAll('input,select'))el.disabled=false;
      panel.querySelector('h2').textContent='GAME SETUP — Start New Game';
      panel.querySelector('p').textContent='Adjust starting forces, replacement rates, and map settings. Start New Game resets the current battlefield.';
      document.getElementById('applyMapSetup').textContent='Start New Game';
      document.getElementById('closeMapSetup').hidden=false;
      document.getElementById('closeMapSetup').textContent='Return to the Game';
      updateForces();
    }
    function closeSetup(restore=false){
      if(restore&&previousSettings)for(const [id,value] of previousSettings)document.getElementById(id).value=value;
      panel.hidden=true;stage.hidden=true;stage.className='';window.ARMAGEDDON_MARCH?.stop();updateForces();
    }
    document.getElementById('mapSetupToggle').onclick=()=>{if(stage.hidden)openSetup();else closeSetup(true);};
    document.getElementById('closeMapSetup').onclick=()=>{if(window.ARMAGEDDON_FIRST_SETUP)return;closeSetup(true);};
    document.getElementById('applyMapSetup').onclick=async()=>{
      if(!window.ARMAGEDDON_FIRST_SETUP&&!confirm('Start a new game? Current unsaved progress and plotted orders will be lost.'))return;
      window.ARMAGEDDON_MARCH?.stop();const params=new URLSearchParams();
      params.set('size',document.getElementById('mapSize').value);
      params.set('customWidth',customWidth.value);
      params.set('customHeight',customHeight.value);
      params.set('deployment',document.getElementById('deployment').value);
      params.set('seed',seedControl.value);
      // Every new campaign receives its own random historical starting date.
      const first=Date.UTC(1939,0,1), last=Date.UTC(1947,11,31);
      const day=86400000;
      const offset=Math.floor(Math.random()*((last-first)/day+1));
      params.set('startDate',new Date(first+offset*day).toISOString().slice(0,10));
      for(const id of ['playerSide','blueUnits','redUnits','blueRP','redRP','blueReplacementRate','redReplacementRate','blueCityRP','redCityRP'])params.set(id,document.getElementById(id).value);
      params.set('unitSymbolStyle',document.getElementById('unitSymbolStyle').value);
      for(const el of fields.querySelectorAll('select'))params.set(el.dataset.density,el.value);
      // M6.64: finish scenario setup before the host selects a personal color.
      const draft=JSON.parse(sessionStorage.getItem('armageddon_game_draft')||'null');
      if(draft?.game && draft?.player){
        sessionStorage.setItem('armageddon_setup_query','?'+params.toString());
        window.location.search='?chooseHostColor=1';
      }else{
        window.location.search='?'+params.toString();
      }
    };

    const loadButton=document.createElement('button');loadButton.type='button';loadButton.textContent='Load Saved Game';loadButton.className='text-button';loadButton.dataset.loadGame='1';loadButton.style.cssText='display:block;margin:12px auto;padding:11px 24px;background:#315d6c;color:white;border-radius:6px;cursor:pointer';
    // Keep Load Saved Game beside Color Picker in the visible setup action bar.
    const setupActions=document.getElementById('applyMapSetup')?.parentElement;
    if(setupActions){setupActions.id='setupActionBar';setupActions.insertBefore(loadButton,setupActions.children[1]||null);const credits=document.getElementById('musicCreditsButton');if(credits)setupActions.insertBefore(credits,setupActions.children[2]||null);}
    else panel.appendChild(loadButton);
    loadButton.onclick=()=>{let saved;try{saved=JSON.parse(localStorage.getItem('ARMAGEDDON_M3_SAVE'));}catch(e){}if(!saved||!saved.query){alert('No saved game found in this browser. Autosaves are created when a game starts and after each completed turn. If you opened a different extracted folder, the browser may use separate storage for that file.');return;}window.location.search=saved.query+(saved.query.includes('?')?'&':'?')+'loadSaved=1';};
    // Music begins on the first user click (browser autoplay policy), continuing through setup.
    const musicSwitch=document.createElement('button');musicSwitch.type='button';musicSwitch.textContent='♫ Music On/Off';musicSwitch.style.cssText='position:fixed;top:12px;right:12px;z-index:9999;padding:9px 14px;border:1px solid #a4b4c5;border-radius:6px;background:#142636;color:#fff;cursor:pointer;font-weight:bold';
    musicSwitch.addEventListener('click',e=>{e.stopPropagation();const m=window.ARMAGEDDON_MARCH;if(!m.enabled){m.setEnabled(true);m.start();}else if(!m.active){m.start();}else{m.setEnabled(false);}musicSwitch.textContent='♫ Music On/Off';musicSwitch.setAttribute('aria-pressed',String(m.enabled));});stage.appendChild(musicSwitch);
    // Opening-screen credits control stays outside the clickable story art.
    const openingCredits=document.createElement('button');
    openingCredits.type='button';openingCredits.textContent='Music Credits';
    openingCredits.setAttribute('aria-label','View music credits');
    openingCredits.style.cssText='position:fixed;bottom:14px;left:14px;z-index:10001;padding:9px 14px;border:1px solid #8fb9de;border-radius:6px;background:#163f67;color:#fff;cursor:pointer;font-weight:bold';
    openingCredits.addEventListener('click',e=>{e.stopPropagation();document.getElementById('musicCreditsDialog')?.showModal();});
    // Introduction, Bluenstein backstory, Redonia backstory, then centered setup.
    const storyImages=['src/backstory.png','src/bluenstein_backstory.png','src/redonia_backstory.png'];
    // M6.104: backstory is shown once, before Games Underway, not during game creation.
    let page=3;window.ARMAGEDDON_FIRST_SETUP=true;
    function showStory(){
      if(page>=0)window.ARMAGEDDON_MARCH?.selectPage(page);
      stage.hidden=false;stage.className=page===1?'blue':page===2?'red':page===3?'setup':'';
      if(page<3){stage.replaceChildren(card,musicSwitch,openingCredits);musicSwitch.textContent='♫ Music On/Off';musicSwitch.setAttribute('aria-pressed',String(!!window.ARMAGEDDON_MARCH?.enabled));card.hidden=false;panel.hidden=true;
        card.innerHTML=`<div class="story-art ${page===0?'intro':page===1?'blue':'red'}" style="aspect-ratio:${page===0?'476 / 512':'1672 / 941'};width:${page===0?'min(93vh,100vw)':'100vw'};height:${page===0?'auto':'100vh'}"><img src="${storyImages[page]}" alt="${['ARMAGEDDON introduction','Bluenstein backstory','Redonia backstory'][page]}"><span class="button-mask" aria-hidden="true"></span></div>`;
        card.style.cssText='width:100%;height:100%;max-width:none;background:none;border:0;padding:0;box-shadow:none;display:flex;align-items:center;justify-content:center';
      }else{card.hidden=true;card.style.display='none';stage.replaceChildren(panel,musicSwitch);panel.hidden=false;panel.style.margin='auto';document.getElementById('closeMapSetup').hidden=true;panel.querySelector('h2').textContent='GAME SETUP — Choose Your Battlefield';panel.querySelector('p').textContent='Choose map size, deployment, and terrain densities. Click Color Picker to choose your player color.';}
    }
    // Start the introductory music on the first story-art click; no extra START GAME overlay.
    stage.addEventListener('click',e=>{if(page>=0 && page<3 && e.target.closest('#storyCard')){
      const music=window.ARMAGEDDON_MARCH;music?.selectPage(page);music?.start();
      page++;showStory();
    }});
    panel.addEventListener('click',e=>e.stopPropagation());
    window.ARMAGEDDON_SHOW_VICTORY=function(side){const file=side==='Blue'?'src/victory-blue.png':'src/victory-red(1).png';stage.hidden=false;stage.className=side==='Blue'?'blue':'red';panel.hidden=true;stage.appendChild(card);card.hidden=false;card.style.cssText='width:100%;height:100%;max-width:none;background:none;border:0;padding:0;box-shadow:none;display:flex;align-items:center;justify-content:center';card.innerHTML=`<img src="${file}" alt="${side==='Blue'?'Bluenstein':'Redonia'} victory" style="max-width:100%;max-height:100%;object-fit:contain">`;page=4;};
    if(new URLSearchParams(location.search).has('returnSetup')){try{const q=new URLSearchParams(sessionStorage.getItem('armageddon_setup_query')||'');for(const [k,v] of q){const el=document.getElementById(k);if(el&&('value' in el))el.value=v;}}catch(_){}}
    if(new URLSearchParams(location.search).has('size')){stage.hidden=true;window.ARMAGEDDON_FIRST_SETUP=false;document.getElementById('closeMapSetup').hidden=false;}else showStory();

  })();
  