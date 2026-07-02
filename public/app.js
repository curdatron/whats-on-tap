const STORAGE_KEY = 'whats-on-tap-data';
const uid = () => Math.random().toString(36).slice(2, 9);
const beer = (name, brewery, style, abv, image = '', showImage = false, price = '') => ({ id: uid(), name, brewery, style, abv, image, showImage, price });
const initial = {
  activeScreen: 0,
  inventory: [],
  appearance: { background: '#10271f', foreground: '#f7f1df', accent: '#efb44c', fontFamily: 'Fraunces', kickerText: 'Whats on tap', footerText: 'Ask the team for today’s recommendations', fontSize: 100, duration: 60, showLogo: true, logoUrl: '', logoImage: '', backgroundImage: '', backgroundImageUrl: '', imageOpacity: 35, imageBrightness: 80, imageContrast: 110, overlayColor: '#10271f', overlayOpacity: 35 },
  screens: [
    { id: uid(), title: 'Draught', sections: [
      { id: uid(), title: 'Cask', beers: [beer('Landlord', 'Timothy Taylor', 'Pale Ale', '4.3%'), beer('Plum Porter', 'Titanic Brewery', 'Porter', '4.9%')] },
      { id: uid(), title: 'Keg', beers: [beer('Neck Oil', 'Beavertown', 'Session IPA', '4.3%'), beer('Helles', 'Camden Town', 'Lager', '4.6%')] }
    ]},
    { id: uid(), title: 'Bottles & Cans', sections: [{ id: uid(), title: 'In the fridge', beers: [beer('Jaipur', 'Thornbridge', 'IPA', '5.9%'), beer('Lucky Saint', 'Lucky Saint', 'Alcohol Free Lager', '0.5%')] }] }
  ]
};

let state = initial;
let selected = 0;
const $ = s => document.querySelector(s);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const save = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); $('#saveStatus').textContent = 'Saving…'; clearTimeout(save.timer); save.timer = setTimeout(async () => { try { const response = await fetch('/api/board', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(state) }); if (!response.ok) throw Error(); $('#saveStatus').textContent = 'Published & saved'; } catch { $('#saveStatus').textContent = 'Saved on this device'; } }, 350); renderPreview(); };

document.querySelectorAll('.nav-item').forEach(button => button.onclick = () => {
  document.querySelectorAll('.nav-item,.panel').forEach(x => x.classList.remove('active'));
  button.classList.add('active'); $(`#${button.dataset.panel}Panel`).classList.add('active');
});

function renderTabs() {
  $('#screenTabs').innerHTML = state.screens.map((screen, i) => `<button class="screen-tab ${i === selected ? 'active' : ''}" data-index="${i}"><span class="screen-drag" draggable="true" title="Drag to reorder screen">${i + 1}</span><div><b>${esc(screen.title || (screen.type === 'image' ? 'Image slide' : 'Untitled screen'))}</b><small>${screen.type === 'image' ? 'Promotional image' : `${(screen.sections || []).reduce((n,s) => n+s.beers.length,0)} beers`}</small></div><i>›</i></button>`).join('');
  document.querySelectorAll('.screen-tab').forEach(tab => {
    const index=Number(tab.dataset.index), handle=tab.querySelector('.screen-drag');
    tab.onclick = () => { selected=index; renderScreens(); };
    handle.ondragstart=e=>{e.stopPropagation();e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-screen',String(index));tab.classList.add('dragging');};
    handle.ondragend=()=>tab.classList.remove('dragging');
    tab.ondragover=e=>{if(Array.from(e.dataTransfer.types).includes('application/x-screen')){e.preventDefault();tab.classList.add('screen-drag-target');}};
    tab.ondragleave=()=>tab.classList.remove('screen-drag-target');
    tab.ondrop=e=>{const raw=e.dataTransfer.getData('application/x-screen');if(raw==='')return;e.preventDefault();e.stopPropagation();const from=Number(raw),activeId=state.screens[selected]?.id;if(Number.isInteger(from)&&from!==index){const[moved]=state.screens.splice(from,1);state.screens.splice(index,0,moved);selected=Math.max(0,state.screens.findIndex(screen=>screen.id===activeId));save();renderScreens();}};
  });
}

function renderScreens() {
  if (!state.screens.length) { state.screens.push({ id: uid(), title: 'New screen', sections: [] }); selected = 0; }
  selected = Math.min(selected, state.screens.length - 1);
  renderTabs(); const screen = state.screens[selected];
  if (screen.type === 'image') { renderImageScreen(screen); return; }
  $('#screenEditor').innerHTML = `<div class="editor-head"><div class="field grow"><label>Screen title</label><input class="title-input" data-screen-title value="${esc(screen.title)}"></div><button class="delete-button" data-delete-screen>Delete screen</button></div>
    <div class="sections">${screen.sections.map((section, si) => sectionHTML(section, si)).join('')}</div>
    <button class="add-section" data-add-section>＋ Add section</button>`;
  bindEditor(screen);
}

function renderImageScreen(screen) {
  $('#screenEditor').innerHTML = `<div class="editor-head"><div class="field grow"><label>Slide name (editor only)</label><input class="title-input" data-image-title value="${esc(screen.title || 'Promotion')}"></div><button class="delete-button" data-delete-image-screen>Delete slide</button></div><div class="image-slide-editor"><div class="image-slide-preview">${screen.image ? `<img src="${esc(screen.image)}" alt="Promotional slide preview">` : '<span>No promotional image selected</span>'}</div><div class="settings-card image-slide-controls"><label>Hosted image address<input class="setting-input" data-image-url type="url" value="${screen.imageSource === 'url' ? esc(screen.image) : ''}" placeholder="https://example.com/promotion.jpg"></label><label class="upload-button">＋ Upload promotional image<input data-image-upload type="file" accept="image/*"></label><p class="hint">Use a 16:9 landscape image for the best fit on a television. Uploaded images are resized before saving.</p></div></div>`;
  $('[data-image-title]').oninput = e => { screen.title=e.target.value; save(); renderTabs(); };
  $('[data-delete-image-screen]').onclick = () => { if(confirm(`Delete the “${screen.title || 'Promotion'}” image slide?`)){ state.screens.splice(selected,1); selected=Math.max(0,selected-1); save(); renderScreens(); } };
  $('[data-image-url]').oninput = e => { screen.image=e.target.value; screen.imageSource='url'; save(); const preview=$('.image-slide-preview'); preview.innerHTML=screen.image ? `<img src="${esc(screen.image)}" alt="Promotional slide preview">` : '<span>No promotional image selected</span>'; };
  $('[data-image-upload]').onchange = e => { const file=e.target.files[0]; if(!file)return; resizeImage(file, data => { screen.image=data; screen.imageSource='upload'; save(); renderImageScreen(screen); }); };
}

function sectionHTML(section, si) { return `<section class="section-card" data-section="${si}"><div class="section-head"><span class="drag" draggable="true" title="Drag to reorder">⠿</span><div class="field grow"><label>Section subtitle</label><input data-section-title value="${esc(section.title)}" placeholder="e.g. Cask"></div><button class="delete-button compact" data-delete-section>Delete section</button></div><div class="beer-list">${section.beers.map((b, bi) => beerHTML(b, bi)).join('')}</div><div class="section-actions"><button class="add-beer" data-add-beer>＋ Add blank beer</button><select data-inventory-picker class="inventory-picker"><option value="">Choose from inventory…</option>${state.inventory.map(item => `<option value="${item.id}">${esc(item.name || 'Untitled')} — ${esc(item.brewery || 'Unknown brewery')}</option>`).join('')}</select><button class="add-beer" data-add-inventory disabled>Add selected</button></div></section>`; }
function beerHTML(b, bi) { return `<div class="beer-row" data-beer="${bi}"><span class="beer-drag" draggable="true" title="Drag to reorder beer">⠿</span><div class="beer-number">${bi + 1}</div><div class="beer-fields"><div class="field wide"><label>Beer name</label><input data-key="name" value="${esc(b.name)}" placeholder="Beer name"></div><div class="field wide"><label>Brewery</label><input data-key="brewery" value="${esc(b.brewery)}" placeholder="Brewery"></div><div class="field"><label>Style</label><input data-key="style" value="${esc(b.style)}" placeholder="IPA"></div><div class="field small"><label>ABV</label><input data-key="abv" value="${esc(b.abv)}" placeholder="4.5%"></div><div class="field small"><label>Price (optional)</label><div class="price-input"><span>£</span><input data-key="price" inputmode="decimal" value="${esc(b.price)}" placeholder="3.50"></div></div></div><div class="image-controls"><label class="toggle"><input type="checkbox" data-image-toggle ${b.showImage ? 'checked' : ''}><span></span> Show pump clip</label>${b.showImage ? `<input class="image-url" data-key="image" value="${esc(b.image)}" placeholder="Paste image link…">` : ''}<button class="save-inventory" data-save-inventory>${b.inventoryId ? 'Update inventory copy' : 'Save to inventory'}</button></div><button class="remove-beer" data-remove-beer title="Remove beer">×</button></div>`; }

function bindEditor(screen) {
  $('[data-screen-title]').oninput = e => { screen.title = e.target.value; save(); renderTabs(); };
  $('[data-delete-screen]').onclick = () => { if (confirm(`Delete the “${screen.title || 'Untitled'}” screen?`)) { state.screens.splice(selected,1); selected = Math.max(0,selected-1); save(); renderScreens(); } };
  $('[data-add-section]').onclick = () => { screen.sections.push({ id: uid(), title: 'New section', beers: [] }); save(); renderScreens(); };
  document.querySelectorAll('[data-section]').forEach(node => {
    const sectionIndex = Number(node.dataset.section), section = screen.sections[sectionIndex];
    node.querySelector('[data-section-title]').oninput = e => { section.title = e.target.value; save(); };
    node.querySelector('[data-delete-section]').onclick = () => { if (confirm(`Delete the “${section.title || 'Untitled'}” section?`)) { screen.sections.splice(sectionIndex,1); save(); renderScreens(); } };
    node.querySelector('[data-add-beer]').onclick = () => { section.beers.push(beer('', '', '', '')); save(); renderScreens(); };
    const picker = node.querySelector('[data-inventory-picker]'), addSelected = node.querySelector('[data-add-inventory]');
    picker.onchange = () => addSelected.disabled = !picker.value;
    addSelected.onclick = () => { const source = state.inventory.find(item => item.id === picker.value); if (!source) return; const added = beer(source.name,source.brewery,source.style,source.abv,source.image,source.showImage,source.price); added.inventoryId = source.id; section.beers.push(added); save(); renderScreens(); };
    const handle = node.querySelector('.drag');
    handle.ondragstart = e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('application/x-section', String(sectionIndex)); node.classList.add('dragging'); };
    handle.ondragend = () => node.classList.remove('dragging');
    node.ondragover = e => { e.preventDefault(); node.classList.add('drag-target'); };
    node.ondragleave = () => node.classList.remove('drag-target');
    node.ondrop = e => { const raw=e.dataTransfer.getData('application/x-section'); if(raw==='')return; e.preventDefault(); const from = Number(raw), to = sectionIndex; if (Number.isInteger(from) && from !== to) { const [moved] = screen.sections.splice(from,1); screen.sections.splice(to,0,moved); save(); renderScreens(); } };
    node.querySelectorAll('[data-beer]').forEach(row => {
      const index = Number(row.dataset.beer), item = section.beers[index];
      const beerHandle=row.querySelector('.beer-drag');
      beerHandle.ondragstart=e=>{ e.stopPropagation(); e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('application/x-beer',String(index)); row.classList.add('dragging'); };
      beerHandle.ondragend=()=>row.classList.remove('dragging');
      row.ondragover=e=>{ if(Array.from(e.dataTransfer.types).includes('application/x-beer')){e.preventDefault();e.stopPropagation();row.classList.add('beer-drag-target');} };
      row.ondragleave=()=>row.classList.remove('beer-drag-target');
      row.ondrop=e=>{ const raw=e.dataTransfer.getData('application/x-beer'); if(raw==='')return; e.preventDefault();e.stopPropagation();const from=Number(raw);if(Number.isInteger(from)&&from!==index){const[moved]=section.beers.splice(from,1);section.beers.splice(index,0,moved);save();renderScreens();} };
      row.querySelectorAll('[data-key]').forEach(input => input.oninput = e => { item[e.target.dataset.key] = e.target.value; save(); });
      row.querySelector('[data-image-toggle]').onchange = e => { item.showImage = e.target.checked; save(); renderScreens(); };
      row.querySelector('[data-save-inventory]').onclick = () => { const record = item.inventoryId && state.inventory.find(x => x.id === item.inventoryId); if (record) Object.assign(record,{name:item.name,brewery:item.brewery,style:item.style,abv:item.abv,price:item.price,image:item.image,showImage:item.showImage}); else { const created = inventoryBeer({name:item.name,brewery:item.brewery,style:item.style,abv:item.abv,price:item.price,image:item.image,showImage:item.showImage}); state.inventory.push(created); item.inventoryId = created.id; } save(); renderScreens(); renderInventory(); };
      row.querySelector('[data-remove-beer]').onclick = () => { section.beers.splice(index,1); save(); renderScreens(); };
    });
  });
}

$('#addScreen').onclick = () => { state.screens.push({ id: uid(), title: `Screen ${state.screens.length + 1}`, sections: [{ id: uid(), title: 'Section', beers: [] }] }); selected = state.screens.length - 1; save(); renderScreens(); };
$('#addImageScreen').onclick = () => { state.screens.push({ id:uid(), type:'image', title:`Promotion ${state.screens.filter(x=>x.type==='image').length+1}`, image:'', imageSource:'url' }); selected=state.screens.length-1; save(); renderScreens(); };

function inventoryBeer(values = {}) { return { id:uid(), name:'', brewery:'', style:'', abv:'', price:'', image:'', showImage:false, containerType:'Cask', customContainer:'', containerCost:'', notes:'', dateOrdered:'', ...values }; }
function renderInventory() {
  const list = $('#inventoryList');
  if (!state.inventory.length) { list.innerHTML = '<div class="empty-inventory"><b>Your inventory is empty</b><p>Add a beer here, or save one from a screen, to reuse it later.</p></div>'; return; }
  list.innerHTML = state.inventory.map((item,index) => `<article class="inventory-card" data-inventory="${index}"><div class="inventory-card-head"><div><span>BEER ${index+1}</span><h2>${esc(item.name || 'Untitled beer')}</h2></div><button class="delete-button compact" data-delete-inventory>Delete beer</button></div><div class="inventory-fields"><label>Beer name<input data-inv-key="name" value="${esc(item.name)}" placeholder="Beer name"></label><label>Brewery<input data-inv-key="brewery" value="${esc(item.brewery)}" placeholder="Brewery"></label><label>Style<input data-inv-key="style" value="${esc(item.style)}" placeholder="Style"></label><label>ABV<input data-inv-key="abv" value="${esc(item.abv)}" placeholder="4.5%"></label><label>Typical price (£)<input data-inv-key="price" value="${esc(item.price)}" inputmode="decimal" placeholder="3.50"></label><label>Container type<select data-inv-key="containerType"><option>Cask</option><option>Pin</option><option>50L Keg</option><option>20L Keg</option><option>10L Keg</option><option>Custom</option></select></label>${item.containerType === 'Custom' ? `<label>Custom container<input data-inv-key="customContainer" value="${esc(item.customContainer)}" placeholder="Describe container"></label>` : ''}<label>Container cost (£)<input data-inv-key="containerCost" value="${esc(item.containerCost)}" inputmode="decimal" placeholder="120.00"></label><label>Date ordered<input data-inv-key="dateOrdered" value="${esc(item.dateOrdered)}" type="date"></label><label class="notes-field">Private notes<textarea data-inv-key="notes" placeholder="Supplier, delivery details, tasting notes…">${esc(item.notes)}</textarea></label></div></article>`).join('');
  document.querySelectorAll('[data-inventory]').forEach(card => { const index=Number(card.dataset.inventory), item=state.inventory[index]; const type=card.querySelector('[data-inv-key="containerType"]'); type.value=item.containerType; card.querySelectorAll('[data-inv-key]').forEach(input => input.oninput = () => { item[input.dataset.invKey]=input.value; save(); if (input.dataset.invKey === 'name') card.querySelector('h2').textContent=input.value||'Untitled beer'; }); type.onchange = () => { item.containerType=type.value; save(); renderInventory(); }; card.querySelector('[data-delete-inventory]').onclick = () => { if(confirm(`Delete “${item.name || 'this beer'}” from inventory?`)){ state.inventory.splice(index,1); save(); renderInventory(); renderScreens(); } }; });
}
$('#addInventoryBeer').onclick = () => { state.inventory.unshift(inventoryBeer()); save(); renderInventory(); };

['background','foreground','accent'].forEach(key => { const input = $(`#${key}`); input.value = state.appearance[key]; $(`#${key}Code`).textContent = state.appearance[key].toUpperCase(); input.oninput = () => { state.appearance[key] = input.value; $(`#${key}Code`).textContent = input.value.toUpperCase(); save(); }; });
$('#fontSize').value = state.appearance.fontSize; $('#fontSizeValue').textContent = `${state.appearance.fontSize}%`; $('#fontSize').oninput = e => { state.appearance.fontSize = Number(e.target.value); $('#fontSizeValue').textContent = `${e.target.value}%`; save(); };
$('#fontFamily').onchange = e => { state.appearance.fontFamily = e.target.value; save(); };
$('#kickerText').oninput = e => { state.appearance.kickerText = e.target.value; save(); };
$('#footerText').oninput = e => { state.appearance.footerText = e.target.value; save(); };
$('#duration').value = state.appearance.duration; $('#durationValue').textContent = `${state.appearance.duration} sec`; $('#duration').oninput = e => { state.appearance.duration = Number(e.target.value); $('#durationValue').textContent = `${e.target.value} sec`; save(); };
const appearanceDefaults = { fontFamily:'Fraunces', kickerText:'Whats on tap', footerText:'Ask the team for today’s recommendations', showLogo:true, logoUrl:'', logoImage:'', backgroundImage:'', backgroundImageUrl:'', imageOpacity:35, imageBrightness:80, imageContrast:110, overlayColor:'#10271f', overlayOpacity:35 };
function setAppearanceControls() {
  const a = state.appearance = { ...appearanceDefaults, ...state.appearance };
  $('#fontFamily').value = a.fontFamily;
  $('#kickerText').value = a.kickerText; $('#footerText').value = a.footerText;
  $('#showLogo').checked = a.showLogo; $('#logoUrl').value = a.logoUrl; $('#logoImageStatus').textContent = a.logoImage ? 'Uploaded logo ready' : 'No uploaded logo';
  $('#backgroundImageUrl').value = a.backgroundImageUrl; $('#backgroundImageStatus').textContent = a.backgroundImage ? 'Uploaded image ready' : 'No uploaded image';
  ['imageOpacity','imageBrightness','imageContrast','overlayOpacity'].forEach(key => { $(`#${key}`).value = a[key]; $(`#${key}Value`).textContent = `${a[key]}%`; });
  $('#overlayColor').value = a.overlayColor; $('#overlayColorCode').textContent = a.overlayColor.toUpperCase();
}
$('#showLogo').onchange = e => { state.appearance.showLogo = e.target.checked; save(); };
$('#logoUrl').oninput = e => { state.appearance.logoUrl = e.target.value; save(); };
$('#backgroundImageUrl').oninput = e => { state.appearance.backgroundImageUrl = e.target.value; save(); };
['imageOpacity','imageBrightness','imageContrast','overlayOpacity'].forEach(key => $(`#${key}`).oninput = e => { state.appearance[key] = Number(e.target.value); $(`#${key}Value`).textContent = `${e.target.value}%`; save(); });
$('#overlayColor').oninput = e => { state.appearance.overlayColor = e.target.value; $('#overlayColorCode').textContent = e.target.value.toUpperCase(); save(); };
function resizeImage(file, done) { const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const scale=Math.min(1,1920/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);done(canvas.toDataURL('image/jpeg',.78));};img.src=reader.result;};reader.readAsDataURL(file); }
$('#backgroundImage').onchange = e => { const file=e.target.files[0];if(!file)return;resizeImage(file,data=>{state.appearance.backgroundImage=data;$('#backgroundImageStatus').textContent=`${file.name} · ready`;save();}); };
$('#logoImage').onchange = e => { const file=e.target.files[0];if(!file)return;resizeImage(file,data=>{state.appearance.logoImage=data;$('#logoImageStatus').textContent=`${file.name} · ready`;save();}); };
$('#removeBackgroundImage').onclick = () => { state.appearance.backgroundImage = ''; $('#backgroundImage').value = ''; $('#backgroundImageStatus').textContent = 'No uploaded image'; save(); };
$('#removeLogoImage').onclick = () => { state.appearance.logoImage = ''; $('#logoImage').value = ''; $('#logoImageStatus').textContent = 'No uploaded logo'; save(); };
function hexToRgba(hex,alpha) { const n=parseInt(hex.slice(1),16); return `rgba(${n>>16},${n>>8&255},${n&255},${alpha})`; }
function renderPreview() { const a = state.appearance, s = state.screens.find(x=>x.type!=='image'), beers = s?.sections?.[0]?.beers || [], bg=a.backgroundImage||a.backgroundImageUrl, image = bg ? `linear-gradient(${hexToRgba(a.overlayColor,a.overlayOpacity/100)},${hexToRgba(a.overlayColor,a.overlayOpacity/100)}),url(${bg}) center/cover` : a.background, logo=a.logoImage||a.logoUrl; $('#miniPreview').style.cssText = `background:${image};background-color:${a.background};color:${a.foreground};font-size:${a.fontSize}%;font-family:${JSON.stringify(a.fontFamily)}`; $('#miniPreview').innerHTML = `${a.showLogo ? (logo ? `<img class="mini-logo" src="${esc(logo)}" alt="">` : '<span class="mini-logo-default">W</span>') : ''}${a.kickerText ? `<small style="color:${a.accent}">${esc(a.kickerText)}</small>` : ''}<h3>${esc(s?.title || 'Your screen')}</h3><b style="color:${a.accent}">${esc(s?.sections?.[0]?.title || 'Section')}</b>${beers.slice(0,3).map(b=>`<p><strong>${esc(b.name || 'Beer name')}</strong><span>${b.price ? `£${esc(b.price)} · ` : ''}${esc(b.abv)}</span><small>${esc(b.brewery)}</small></p>`).join('')}`; }
async function start() {
  try {
    const remote = await fetch('/api/board', { cache:'no-store' }).then(r => r.json());
    state = remote?.screens?.length ? remote : (JSON.parse(localStorage.getItem(STORAGE_KEY)) || initial);
  } catch { try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || initial; } catch { state = initial; } }
  state.inventory = state.inventory || [];
  ['background','foreground','accent'].forEach(key => { $(`#${key}`).value = state.appearance[key]; $(`#${key}Code`).textContent = state.appearance[key].toUpperCase(); });
  $('#fontSize').value = state.appearance.fontSize; $('#fontSizeValue').textContent = `${state.appearance.fontSize}%`;
  $('#duration').value = state.appearance.duration; $('#durationValue').textContent = `${state.appearance.duration} sec`;
  setAppearanceControls();
  renderScreens(); renderInventory(); renderPreview(); save();
  try { const addresses=await fetch('/api/network',{cache:'no-store'}).then(r=>r.json()); $('#networkAddresses').innerHTML=addresses.length ? addresses.map(address=>`<code>${esc(address)}</code>`).join('<br>') : 'No local-network address was detected.'; } catch { $('#networkAddresses').textContent='Restart the app to detect the current network address.'; }
}
start();
