(() => {
  let activePurpose = '';
  const form = document.querySelector('#property-form');
  const statusLabel = form.querySelector('[name="status"]').closest('label');
  const purposeLabel = document.createElement('label');
  purposeLabel.innerHTML = 'Listing purpose<select name="purpose"><option value="Sale">For sale</option><option value="Rent">For rent</option></select>';
  statusLabel.before(purposeLabel);

  visible = () => {
    const q = search.value.toLowerCase();
    return properties.filter(p =>
      (!q || `${p.title} ${p.location}`.toLowerCase().includes(q)) &&
      (!typeFilter.value || p.type === typeFilter.value) &&
      (!statusFilter.value || p.status === statusFilter.value) &&
      (!activePurpose || (p.purpose || 'Sale') === activePurpose)
    );
  };

  const resetCategory = () => { activePurpose = ''; typeFilter.value = ''; };
  document.querySelector('#clear-filters').addEventListener('click', resetCategory, true);
  document.querySelector('.brand').addEventListener('click', () => { resetCategory(); render(); }, true);
  document.querySelector('a[href="#inventory"]').addEventListener('click', () => { resetCategory(); render(); }, true);
  document.querySelectorAll('.category-link').forEach(link => link.addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    activePurpose = link.dataset.purpose || '';
    typeFilter.value = link.dataset.type || '';
    statusFilter.value = ''; search.value = '';
    document.querySelectorAll('.nav-link').forEach(item => item.classList.toggle('active', item === link));
    document.querySelector('header').classList.remove('is-hidden');
    document.querySelector('#stats').classList.remove('is-hidden');
    document.querySelector('#inventory').classList.remove('is-hidden');
    document.querySelector('#shared').classList.add('is-hidden');
    document.querySelector('#settings').classList.add('is-hidden');
    render();
  }, true));
})();
