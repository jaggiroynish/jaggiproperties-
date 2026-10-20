(() => {
  const settingsKey = 'jaggi-properties-settings';
  const settings = JSON.parse(localStorage.getItem(settingsKey) || '{"name":"Jaggi Properties","countryCode":"91"}');
  const inventory = document.querySelector('#inventory');
  const stats = document.querySelector('#stats');
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const sharePanel = document.createElement('section');
  const settingsPanel = document.createElement('section');
  sharePanel.id = 'shared'; settingsPanel.id = 'settings';
  sharePanel.className = settingsPanel.className = 'app-panel is-hidden';
  sharePanel.innerHTML = '<div class="section-top"><div><p class="eyebrow">CUSTOMER SHARING</p><h2>Shared property links</h2><p>Copy a listing link or open it directly for a customer.</p></div></div><div id="share-list" class="share-list"></div>';
  settingsPanel.innerHTML = '<div class="section-top"><div><p class="eyebrow">BUSINESS SETTINGS</p><h2>Make it yours</h2><p>These settings are saved on this device.</p></div></div><form id="settings-form" class="settings-card"><label>Business name<input name="name" maxlength="45" required></label><label>WhatsApp country code<input name="countryCode" inputmode="numeric" maxlength="3" required></label><p class="settings-help">For India, keep the country code as 91. This is used when opening WhatsApp messages.</p><div class="settings-actions"><button class="primary" type="submit">Save changes</button><button class="text-button" type="button" id="export-data">Download backup</button></div><p class="save-state" id="save-state" aria-live="polite"></p></form>';
  main.append(sharePanel, settingsPanel);
  const mobileNav = document.createElement('nav');
  mobileNav.className = 'mobile-nav';
  mobileNav.innerHTML = '<button type="button" data-view="inventory"><span>⌂</span>Home</button><button type="button" data-view="shared"><span>↗</span>Share</button><button type="button" class="mobile-add" aria-label="Add property">+</button><button type="button" data-view="settings"><span>⚙</span>Settings</button></nav>';
  document.body.append(mobileNav);

  const linkFor = p => `${location.href.split('#')[0]}#property=${encodeURIComponent(p.id)}`;
  const copyText = async (text, button) => {
    try { await navigator.clipboard.writeText(text); }
    catch { const temp = document.createElement('textarea'); temp.value = text; document.body.append(temp); temp.select(); document.execCommand('copy'); temp.remove(); }
    const label = button.textContent; button.textContent = 'Copied!'; setTimeout(() => button.textContent = label, 1200);
  };
  function renderSharedLinks() {
    const list = document.querySelector('#share-list');
    list.innerHTML = properties.length ? properties.map(p => `<article class="share-item"><div><b>${esc(p.title)}</b><span>${esc(p.location)} · ${money(p.price)}</span></div><div class="share-actions"><button class="outline-button" data-copy="${esc(p.id)}">Copy link</button><button class="outline-button" data-open="${esc(p.id)}">Open</button></div></article>`).join('') : '<div class="empty">Add a property first to create shareable links.</div>';
    list.querySelectorAll('[data-copy]').forEach(button => button.onclick = () => copyText(linkFor(properties.find(p => p.id === button.dataset.copy)), button));
    list.querySelectorAll('[data-open]').forEach(button => button.onclick = () => { showView('inventory'); window.location.hash = `property=${button.dataset.open}`; openProperty(button.dataset.open); });
  }
  function showView(view) {
    const showingInventory = view === 'inventory';
    header.classList.toggle('is-hidden', !showingInventory); stats.classList.toggle('is-hidden', !showingInventory); inventory.classList.toggle('is-hidden', !showingInventory);
    sharePanel.classList.toggle('is-hidden', view !== 'shared'); settingsPanel.classList.toggle('is-hidden', view !== 'settings');
    document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${view}`));
    mobileNav.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view));
    if (view === 'shared') renderSharedLinks();
    if (view === 'settings') { const form = document.querySelector('#settings-form'); form.elements.name.value = settings.name; form.elements.countryCode.value = settings.countryCode; }
  }
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', event => { event.preventDefault(); showView(link.getAttribute('href').slice(1)); }));
  mobileNav.querySelectorAll('[data-view]').forEach(button => button.onclick = () => showView(button.dataset.view));
  mobileNav.querySelector('.mobile-add').onclick = () => document.querySelector('#add-dialog').showModal();
  document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); showView('inventory'); window.scrollTo({top:0, behavior:'smooth'}); });

  document.querySelector('#settings-form').onsubmit = event => {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget));
    settings.name = data.name.trim(); settings.countryCode = data.countryCode.replace(/\D/g, '') || '91'; localStorage.setItem(settingsKey, JSON.stringify(settings));
    document.querySelector('.brand > span:last-child').innerHTML = `${esc(settings.name.split(' ')[0] || 'Jaggi')} <span>${esc(settings.name.split(' ').slice(1).join(' ') || 'Properties')}</span>`;
    document.querySelector('#save-state').textContent = 'Saved successfully.';
  };
  document.querySelector('#export-data').onclick = () => { const blob = new Blob([JSON.stringify({settings, properties}, null, 2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'jaggi-properties-backup.json'; a.click(); URL.revokeObjectURL(a.href); };

  openProperty = id => {
    const p = properties.find(item => item.id === id); if (!p) return;
    const images = p.images || [p.image];
    const message = `🏠 Property: ${p.title}\n📍 Location: ${p.location}\n💰 Price: ${money(p.price)}\n📐 Area: ${p.area}${p.beds ? `\n🛏️ Bedrooms: ${p.beds}` : ''}${p.baths ? `\n🛁 Bathrooms: ${p.baths}` : ''}\n\nInterested? Reply for more details.`;
    document.querySelector('#modal-content').innerHTML = `<div class="modal-hero" id="hero" style="background-image:url('${esc(images[0])}')"></div>${images.length > 1 ? `<div class="image-strip">${images.map((src, index) => `<img src="${esc(src)}" data-image="${esc(src)}" alt="Property photo ${index + 1}">`).join('')}</div>` : ''}<p class="eyebrow">${esc(p.type)} · ${esc(p.status)}</p><h2>${esc(p.title)}</h2><p class="location">⌖ ${esc(p.location)}</p><div class="modal-price">${money(p.price)}</div><div class="details">${esc(p.area)}${p.beds ? ` · ${p.beds} bedrooms` : ''}${p.baths ? ` · ${p.baths} bathrooms` : ''}</div><p class="modal-desc">${esc(p.description || 'No description added yet.')}</p><div class="share-box"><b>Share this property</b><div class="share-row"><button type="button" class="outline-button" id="copy-link">Copy property link</button></div><div class="share-row"><input id="phone" inputmode="numeric" placeholder="Customer WhatsApp number (10 digits)"><button type="button" class="whatsapp" id="share-btn">WhatsApp</button></div></div>`;
    document.querySelector('#property-dialog').showModal();
    document.querySelectorAll('[data-image]').forEach(image => image.onclick = () => document.querySelector('#hero').style.backgroundImage = `url('${image.dataset.image}')`);
    document.querySelector('#copy-link').onclick = event => copyText(linkFor(p), event.currentTarget);
    document.querySelector('#share-btn').onclick = () => { const number = document.querySelector('#phone').value.replace(/\D/g, ''); if (!/^[6-9]\d{9}$/.test(number)) return alert('Please enter a valid 10-digit Indian mobile number.'); window.open(`https://wa.me/${settings.countryCode}${number}?text=${encodeURIComponent(message)}`, '_blank'); };
  };
})();
