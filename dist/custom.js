(() => {
  const oldPhotoField = document.querySelector('[name="image"]');
  const photoLabel = oldPhotoField.closest('label');
  oldPhotoField.type = 'file';
  oldPhotoField.name = 'images';
  oldPhotoField.id = 'photo-input';
  oldPhotoField.accept = 'image/*';
  oldPhotoField.multiple = true;
  oldPhotoField.required = true;
  oldPhotoField.removeAttribute('placeholder');
  photoLabel.classList.add('photo-picker');
  photoLabel.firstChild.textContent = 'Property photos ';
  photoLabel.insertAdjacentHTML('beforeend', '<small>Select one or more photos from your phone or computer. Images are compressed before saving.</small><div id="photo-preview" class="photo-preview"></div>');

  const photoPreview = document.querySelector('#photo-preview');
  oldPhotoField.addEventListener('change', () => {
    photoPreview.innerHTML = '';
    [...oldPhotoField.files].forEach(file => {
      const image = document.createElement('img');
      image.src = URL.createObjectURL(file);
      image.alt = 'Selected property photo';
      photoPreview.append(image);
    });
  });

  const compress = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .8));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const form = document.querySelector('#property-form');
  form.onsubmit = async event => {
    event.preventDefault();
    const files = [...oldPhotoField.files];
    if (!files.length) return;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Saving photos…';
    try {
      const fields = Object.fromEntries(new FormData(form));
      const images = await Promise.all(files.map(compress));
      properties.unshift({...fields, id: `property-${Date.now()}`, price: Number(fields.price), beds: Number(fields.beds), baths: Number(fields.baths), image: images[0], images});
      save(); render(); form.reset(); photoPreview.innerHTML = '';
      document.querySelector('#add-dialog').close();
    } catch {
      alert('Photo save nahi ho saki. Kripya dobara try karein.');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Save property';
    }
  };

  openProperty = id => {
    const p = properties.find(item => item.id === id);
    if (!p) return;
    const images = p.images || [p.image];
    const message = `🏠 Property: ${p.title}\n📍 Location: ${p.location}\n💰 Price: ${money(p.price)}\n📐 Area: ${p.area}${p.beds ? `\n🛏️ Bedrooms: ${p.beds}` : ''}${p.baths ? `\n🛁 Bathrooms: ${p.baths}` : ''}\n\nInterested? Reply for more details.`;
    document.querySelector('#modal-content').innerHTML = `<div class="modal-hero" id="hero" style="background-image:url('${esc(images[0])}')"></div>${images.length > 1 ? `<div class="image-strip">${images.map((src, index) => `<img src="${esc(src)}" data-image="${esc(src)}" alt="Property photo ${index + 1}">`).join('')}</div>` : ''}<p class="eyebrow">${esc(p.type)} · ${esc(p.status)}</p><h2>${esc(p.title)}</h2><p class="location">⌖ ${esc(p.location)}</p><div class="modal-price">${money(p.price)}</div><div class="details">${esc(p.area)}${p.beds ? ` · ${p.beds} bedrooms` : ''}${p.baths ? ` · ${p.baths} bathrooms` : ''}</div><p class="modal-desc">${esc(p.description || 'No description added yet.')}</p><div class="share-box"><b>Share on WhatsApp</b><div class="share-row"><input id="phone" inputmode="numeric" placeholder="Customer WhatsApp number (10 digits)"><button class="whatsapp" id="share-btn">Share</button></div></div>`;
    document.querySelector('#property-dialog').showModal();
    document.querySelectorAll('[data-image]').forEach(image => image.onclick = () => document.querySelector('#hero').style.backgroundImage = `url('${image.dataset.image}')`);
    document.querySelector('#share-btn').onclick = () => {
      const number = document.querySelector('#phone').value.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(number)) return alert('Please enter a valid 10-digit Indian mobile number.');
      window.open(`https://wa.me/91${number}?text=${encodeURIComponent(message)}`, '_blank');
    };
  };
})();
