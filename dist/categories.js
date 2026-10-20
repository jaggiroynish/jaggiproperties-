(() => {
  let activePurpose = '';
  const form = document.querySelector('#property-form');
  const statusLabel = form.querySelector('[name="status"]').closest('label');
  const purposeLabel = document.createElement('label');
  purposeLabel.innerHTML = 'Listing purpose<select name="purpose"><option value="Sale">For sale</option><option value="Rent">For rent</option></select>';
  statusLabel.before(purposeLabel);
  const areaInput = form.querySelector('[name="area"]');
  areaInput.closest('label').firstChild.textContent = 'Size (Gaj) ';
  areaInput.placeholder = 'e.g. 150';
  areaInput.inputMode = 'numeric';
  areaInput.pattern = '[0-9]*';
  areaInput.required = true;
  form.addEventListener('submit', () => {
    const number = areaInput.value.trim().replace(/\s*gaj$/i, '');
    if (/^\d+(\.\d+)?$/.test(number)) areaInput.value = `${number} Gaj`;
  }, true);

  let converted = false;
  properties.forEach(property => {
    const number = Number(String(property.area || '').replace(/[^\d.]/g, ''));
    if (!Number.isFinite(number)) return;
    if (/sq\.?\s*ft/i.test(property.area)) { property.area = `${Math.round(number / 9)} Gaj`; converted = true; }
    if (/sq\.?\s*yards?/i.test(property.area)) { property.area = `${number} Gaj`; converted = true; }
  });
  if (converted) save();

  const sizeFilter = document.createElement('select');
  sizeFilter.id = 'size-filter';
  sizeFilter.setAttribute('aria-label', 'Filter by size');
  document.querySelector('#type-filter').after(sizeFilter);
  typeFilter.insertAdjacentHTML('beforeend', '<option value="Rent">Rent</option>');
  function refreshSizeOptions() {
    const selected = sizeFilter.value;
    const sizes = [...new Set(properties.map(p => p.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, {numeric:true}));
    sizeFilter.innerHTML = `<option value="">All sizes</option>${sizes.map(size => `<option value="${esc(size)}">${esc(size)}</option>`).join('')}`;
    if (sizes.includes(selected)) sizeFilter.value = selected;
  }

  visible = () => {
    const q = search.value.toLowerCase();
    return properties.filter(p =>
      (!q || `${p.title} ${p.location}`.toLowerCase().includes(q)) &&
      (!typeFilter.value || (typeFilter.value === 'Rent' ? (p.purpose || 'Sale') === 'Rent' : p.type === typeFilter.value)) &&
      (!sizeFilter.value || p.area === sizeFilter.value) &&
      (!statusFilter.value || p.status === statusFilter.value) &&
      (!activePurpose || (p.purpose || 'Sale') === activePurpose)
    );
  };

  const baseRender = render;
  render = () => { refreshSizeOptions(); baseRender(); };
  sizeFilter.addEventListener('input', render);
  const resetCategory = () => { activePurpose = ''; typeFilter.value = ''; sizeFilter.value = ''; };
  document.querySelector('#clear-filters').addEventListener('click', resetCategory, true);
  document.querySelector('.brand').addEventListener('click', () => { resetCategory(); render(); }, true);
  document.querySelector('a[href="#inventory"]').addEventListener('click', () => { resetCategory(); render(); }, true);
  document.querySelectorAll('.category-link').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    activePurpose = link.dataset.purpose || '';
    typeFilter.value = link.dataset.type || '';
    sizeFilter.value = ''; statusFilter.value = ''; search.value = '';
    document.querySelectorAll('.nav-link').forEach(item => item.classList.toggle('active', item === link));
    document.querySelector('header').classList.remove('is-hidden');
    document.querySelector('#stats').classList.remove('is-hidden');
    document.querySelector('#inventory').classList.remove('is-hidden');
    document.querySelector('#shared').classList.add('is-hidden');
    document.querySelector('#settings').classList.add('is-hidden');
    render();
  }, true));
  render();
})();
