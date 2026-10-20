(() => {
  const key = 'jaggi-properties-about';
  const defaults = {
    heading: 'About Jaggi Properties',
    intro: 'Helping people explore properties with clear information and personal attention.',
    story: 'Jaggi Properties is focused on making property discovery simpler. Browse available homes, plots and commercial spaces, and connect with us for more details.',
    contact: '',
    location: 'Ludhiana, Punjab'
  };
  let about;
  try { about = {...defaults, ...JSON.parse(localStorage.getItem(key) || '{}')}; }
  catch { about = {...defaults}; }
  const nav = document.querySelector('.sidebar nav');
  const link = document.createElement('a');
  link.className = 'nav-link';
  link.href = '#about';
  link.innerHTML = '<span>ⓘ</span> About us';
  nav.insertBefore(link, nav.querySelector('[href="#settings"]'));
  const panel = document.createElement('section');
  panel.id = 'about';
  panel.className = 'app-panel is-hidden';
  panel.innerHTML = '<div class="section-top"><div><p class="eyebrow">GET TO KNOW US</p><h2 id="about-heading"></h2></div><button class="text-button" type="button" id="about-edit">Edit about</button></div><div class="settings-card"><p id="about-intro" style="font-size:1.25rem;font-weight:600;line-height:1.6"></p><p id="about-story" style="line-height:1.8;white-space:pre-line"></p><p class="location" id="about-location"></p><p id="about-contact"></p></div>';
  document.querySelector('main').append(panel);
  const dialog = document.createElement('dialog');
  dialog.id = 'about-dialog';
  dialog.innerHTML = '<form class="modal form-modal" id="about-form"><button class="close" type="button" id="about-close">×</button><p class="eyebrow">YOUR BUSINESS PROFILE</p><h2>Edit About section</h2><div class="form-grid"><label class="full">Heading<input name="heading" required maxlength="100"></label><label class="full">Short introduction<textarea name="intro" required maxlength="500"></textarea></label><label class="full">Our story<textarea name="story" required maxlength="2000"></textarea></label><label>Location<input name="location" maxlength="120"></label><label>Contact details (optional)<input name="contact" maxlength="160"></label></div><button class="primary full-button" type="submit">Save About</button></form>';
  document.body.append(dialog);
  const form = dialog.querySelector('form');
  const showContent = () => {
    ['heading','intro','story','location','contact'].forEach(k => {
      const node = document.querySelector('#about-'+k);
      if (node) node.textContent = k === 'location' && about[k] ? '⌖ '+about[k] : about[k];
    });
  };
  const showAbout = () => {
    document.querySelector('header').classList.add('is-hidden');
    ['stats','inventory','shared','settings','customers'].forEach(id => document.getElementById(id)?.classList.add('is-hidden'));
    document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    panel.classList.remove('is-hidden');
    showContent();
  };
  link.addEventListener('click', e => { e.preventDefault(); showAbout(); });
  document.querySelectorAll('.nav-link:not([href="#about"])').forEach(a => a.addEventListener('click', () => panel.classList.add('is-hidden')));
  document.querySelectorAll('.mobile-nav [data-view]').forEach(b => b.addEventListener('click', () => panel.classList.add('is-hidden')));
  document.querySelector('.brand').addEventListener('click', () => panel.classList.add('is-hidden'));
  document.querySelector('#about-edit').onclick = () => {
    Object.keys(defaults).forEach(k => form.elements[k].value = about[k] || '');
    dialog.showModal();
  };
  document.querySelector('#about-close').onclick = () => dialog.close();
  form.onsubmit = e => {
    e.preventDefault();
    const next = Object.fromEntries(new FormData(form));
    about = next;
    try { localStorage.setItem(key, JSON.stringify(about)); }
    catch { alert('Could not save About details on this device.'); return; }
    showContent(); dialog.close();
  };
  showContent();
})();