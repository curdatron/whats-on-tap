let data;
let current = 0;
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function render() {
  const screen = data.screens[current], a = data.appearance;
  document.body.style.cssText = `--board-bg:${a.background};--board-text:${a.foreground};--board-accent:${a.accent};--board-scale:${a.fontSize/100};--board-font:${JSON.stringify(a.fontFamily || 'Fraunces')};--board-image:${a.backgroundImage ? `url("${a.backgroundImage}")` : 'none'};--image-opacity:${(a.imageOpacity ?? 35)/100};--image-brightness:${a.imageBrightness ?? 80}%;--image-contrast:${a.imageContrast ?? 110}%;--overlay:${a.overlayColor || a.background};--overlay-opacity:${(a.overlayOpacity ?? 35)/100}`;
  const logo = a.showLogo === false ? '' : (a.logoUrl ? `<div class="display-brand custom"><img src="${esc(a.logoUrl)}" alt="Venue logo" onerror="this.parentNode.style.display='none'"></div>` : '<div class="display-brand">W</div>');
  document.getElementById('display').innerHTML = `<header><div><p>WHATS ON TAP</p><h1>${esc(screen.title)}</h1></div>${logo}</header><div class="display-sections">${screen.sections.map(section => `<section><h2>${esc(section.title)}</h2><div>${section.beers.map(beer => `<article>${beer.showImage && beer.image ? `<div class="pumpclip"><img src="${esc(beer.image)}" alt="" onerror="this.parentNode.style.display='none'"></div>` : ''}<div class="beer-copy"><h3>${esc(beer.name || 'Untitled beer')}</h3><p>${esc(beer.brewery)}${beer.style ? `<span> · ${esc(beer.style)}</span>` : ''}</p></div><div class="beer-numbers"><b>${esc(beer.abv)}</b>${beer.price ? `<strong>£${esc(beer.price)}</strong>` : ''}</div></article>`).join('') || '<p class="empty-list">More beers coming soon</p>'}</div></section>`).join('')}</div><footer>ASK THE TEAM FOR TODAY’S RECOMMENDATIONS <span>${current+1} / ${data.screens.length}</span></footer>`;
  const progress = document.getElementById('progress'); progress.style.animation = 'none'; progress.offsetHeight; progress.style.animation = `progress ${a.duration || 60}s linear`;
}
async function start() {
  try { data = await fetch('/api/board', { cache:'no-store' }).then(r => r.json()); } catch {}
  if (!data?.screens?.length) { try { data = JSON.parse(localStorage.getItem('whats-on-tap-data')); } catch {} }
  if (!data?.screens?.length) data = { appearance: { background:'#10271f', foreground:'#f7f1df', accent:'#efb44c', fontSize:100, duration:60 }, screens:[{title:'Whats On Tap',sections:[]}] };
  render();
  setInterval(async () => {
    try { const fresh = await fetch('/api/board', { cache:'no-store' }).then(r => r.json()); if (fresh?.screens?.length) data = fresh; } catch {}
    current = (current + 1) % data.screens.length; render();
  }, (data.appearance.duration || 60) * 1000);
}
start();
