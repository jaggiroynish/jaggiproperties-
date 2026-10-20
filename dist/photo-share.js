/* Share actual property photos through the device share sheet.
 * Existing local property data and the private Supabase bucket are unchanged.
 * A website cannot force WhatsApp to select a specific contact or silently send media.
 */
(() => {
  const originalOpenProperty = openProperty;
  const phonePattern = /^[6-9]\d{9}$/;

  function messageFor(p) {
    const parts = [
      '🏠 ' + p.title,
      '📍 Location: ' + p.location,
      '💰 Price: ' + money(p.price),
      '📐 Area: ' + (p.area || 'Ask for details'),
      '🏷️ Status: ' + p.status
    ];
    if (p.beds) parts.push('🛏️ Bedrooms: ' + p.beds);
    if (p.baths) parts.push('🛁 Bathrooms: ' + p.baths);
    if (p.description) parts.push('', p.description);
    parts.push('', 'Jaggi Properties — Contact us for more details.');
    return parts.join('\n');
  }

  function photoSources(p) {
    const values = Array.isArray(p.images) && p.images.length ? p.images : [p.image];
    return values.filter(src => typeof src === 'string' && /^(data:image\/(jpeg|png|webp);base64,|https?:\/\/)/i.test(src));
  }

  async function fileFromSource(source, index, id) {
    const response = await fetch(source);
    if (!response.ok) throw new Error('Cannot fetch property image ' + (index + 1));
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('Image file format not supported');
    const type = ['image/jpeg', 'image/png', 'image/webp'].includes(blob.type) ? blob.type : 'image/jpeg';
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
    const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0,35);
    return new File([blob], 'Jaggi-Property-' + safeId + '-' + (index + 1) + '.' + ext, { type });
  }

  function countryCode() {
    try {
      const settings = JSON.parse(localStorage.getItem('jaggi-properties-settings') || '{}');
      return String(settings.countryCode || '91').replace(/\D/g, '') || '91';
    } catch { return '91'; }
  }

  function openWhatsApp(phone, message) {
    if (!phonePattern.test(phone)) {
      alert('Customer ka valid 10-digit WhatsApp number daalo.');
      return;
    }
    window.open('https://wa.me/' + countryCode() + phone + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
  }

  openProperty = function (id) {
    originalOpenProperty(id);
    const p = properties.find(item => item.id === id);
    const box = document.querySelector('#modal-content .share-box');
    const shareButton = document.querySelector('#share-btn');
    if (!p || !box || !shareButton) return;

    const message = messageFor(p);
    const phoneInput = document.querySelector('#phone');
    const sources = photoSources(p);
    const info = document.createElement('p');
    info.className = 'photo-share-note';
    info.textContent = 'Photo + details: phone par WhatsApp aur customer select karo. Mac par photo download karke WhatsApp mein attach karo.';
    box.append(info);
    const status = document.createElement('p');
    status.className = 'photo-share-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    box.append(status);
    const fallback = document.createElement('div');
    fallback.className = 'photo-share-fallback';
    box.append(fallback);

    const textButton = document.createElement('button');
    textButton.type = 'button';
    textButton.className = 'outline-button';
    textButton.textContent = 'WhatsApp details only';
    box.append(textButton);
    textButton.addEventListener('click', () => openWhatsApp(phoneInput.value.replace(/\D/g, ''), message));

    shareButton.textContent = '📷 Share photos + details';
    shareButton.type = 'button';
    shareButton.onclick = null;

    function showManualSteps(files) {
      fallback.replaceChildren();
      const heading = document.createElement('p');
      heading.textContent = 'WhatsApp par photo attachment ke liye:';
      fallback.append(heading);
      const instructions = document.createElement('p');
      instructions.textContent = '1. Neeche photo save karo. 2. WhatsApp details kholo. 3. WhatsApp mein photo attach karke Send dabao.';
      fallback.append(instructions);
      files.forEach((file, index) => {
        const anchor = document.createElement('a');
        anchor.className = 'outline-button';
        anchor.textContent = '⬇ Download photo ' + (index + 1);
        const objectUrl = URL.createObjectURL(file);
        anchor.href = objectUrl;
        anchor.download = file.name;
        anchor.addEventListener('click', () => setTimeout(() => URL.revokeObjectURL(objectUrl), 60000), { once: true });
        fallback.append(anchor);
      });
      if (!files.length) {
        sources.forEach((source, index) => {
          const anchor = document.createElement('a');
          anchor.className = 'outline-button';
          anchor.href = source;
          anchor.textContent = '↗ Open photo ' + (index + 1) + ' to save';
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          fallback.append(anchor);
        });
      }
      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.className = 'whatsapp';
      openButton.textContent = 'Open WhatsApp with details';
      openButton.addEventListener('click', () => openWhatsApp(phoneInput.value.replace(/\D/g, ''), message));
      fallback.append(openButton);
    }

    // Prepare files when the property modal opens. navigator.share must be
    // called during the user's click itself, before awaiting any async work.
    let preparedFiles = null;
    let preparationFailed = false;
    shareButton.disabled = true;
    shareButton.textContent = 'Preparing property photos…';
    if (sources.length) {
      Promise.all(sources.map((source, index) => fileFromSource(source, index, p.id)))
        .then(files => {
          preparedFiles = files;
          status.textContent = 'Photos ready to share. Choose WhatsApp and the customer on your device.';
        })
        .catch(error => {
          preparationFailed = true;
          console.warn('Could not prepare some property photos:', error);
          status.textContent = 'Photo attachment preparation failed. Use the photo download/open options below.';
        })
        .finally(() => {
          shareButton.disabled = false;
          shareButton.textContent = '📷 Share photos + details';
        });
    } else {
      shareButton.disabled = false;
      shareButton.textContent = '📷 Share photos + details';
    }

    shareButton.addEventListener('click', () => {
      if (!sources.length) {
        status.textContent = 'Is listing mein koi photo available nahi hai.';
        return;
      }
      const enteredPhone = phoneInput.value.replace(/\D/g, '');
      if (enteredPhone && !phonePattern.test(enteredPhone)) {
        status.textContent = 'Phone number 10-digit Indian mobile number hona chahiye.';
        return;
      }
      const files = preparedFiles || [];
      fallback.replaceChildren();
      if (!preparationFailed && files.length &&
          typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files })) {
        // This must happen synchronously within the click event.
        navigator.share({ title: p.title, text: message, files })
          .then(() => {
            status.textContent = 'Share sheet completed. Confirm that WhatsApp sent the photos and details.';
          })
          .catch(error => {
            if (error.name === 'AbortError') {
              status.textContent = 'Sharing cancelled.';
            } else {
              status.textContent = 'Photo sharing failed on this browser. Use manual attachment below.';
              showManualSteps(files);
            }
          });
      } else {
        status.textContent = 'Direct photo sharing is not available in this browser. Please attach the photos manually in WhatsApp.';
        showManualSteps(files);
      }
    });

    const copyDetails = document.createElement('button');
    copyDetails.type = 'button';
    copyDetails.className = 'outline-button';
    copyDetails.textContent = 'Copy full property details';
    box.append(copyDetails);
    copyDetails.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(message);
        status.textContent = 'Property details copied. Paste in WhatsApp if the share sheet omits the caption.';
      } catch {
        status.textContent = 'Could not copy details. Use the WhatsApp details button.';
      }
    });
  };
})();