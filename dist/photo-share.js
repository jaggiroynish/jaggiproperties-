/* WhatsApp-only property sharing for Jaggi Properties.
 * Browsers cannot silently attach media to a specific WhatsApp chat.
 * This opens the selected customer's chat and prepares actual image files
 * for clipboard paste (when supported) or manual attachment.
 */
(() => {
  const previousOpenProperty = openProperty;
  const indianMobile = /^[6-9]\d{9}$/;

  function propertyText(property) {
    const lines = [
      '🏠 Property: ' + property.title,
      '📍 Location: ' + property.location,
      '💰 Price: ' + money(property.price),
      '📐 Area: ' + (property.area || 'Contact for details'),
      '🏷️ Status: ' + property.status
    ];
    if (property.beds) lines.push('🛏️ Bedrooms: ' + property.beds);
    if (property.baths) lines.push('🛁 Bathrooms: ' + property.baths);
    if (property.description) lines.push('', property.description);
    lines.push('', 'Jaggi Properties — Contact us for more details.');
    return lines.join('\n');
  }

  function imageSources(property) {
    const images = Array.isArray(property.images) && property.images.length
      ? property.images : [property.image];
    return images.filter(src => typeof src === 'string' &&
      /^(data:image\/(jpeg|png|webp);base64,|https?:\/\/)/i.test(src));
  }

  function getCountryCode() {
    try {
      const prefs = JSON.parse(localStorage.getItem('jaggi-properties-settings') || '{}');
      return String(prefs.countryCode || '91').replace(/\D/g, '') || '91';
    } catch {
      return '91';
    }
  }

  function pngFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          canvas.getContext('2d').drawImage(image, 0, 0);
          canvas.toBlob(result => {
            URL.revokeObjectURL(url);
            result ? resolve(result) : reject(new Error('Image conversion failed'));
          }, 'image/png');
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Unable to read photo'));
      };
      image.src = url;
    });
  }

  openProperty = function (id) {
    previousOpenProperty(id);
    const property = properties.find(item => item.id === id);
    const box = document.querySelector('#modal-content .share-box');
    const whatsappButton = document.querySelector('#share-btn');
    const phoneInput = document.querySelector('#phone');
    if (!property || !box || !whatsappButton || !phoneInput) return;

    // The link to this localhost page is not useful for external customers.
    document.querySelector('#copy-link')?.closest('.share-row')?.remove();

    const description = document.createElement('p');
    description.className = 'photo-share-note';
    description.textContent = 'Customer ka number daalo. WhatsApp chat seedha khulega. Mac par photo paste karne ke liye ⌘V dabao, phir Send.';
    box.append(description);

    const status = document.createElement('p');
    status.className = 'photo-share-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    box.append(status);

    const downloadRow = document.createElement('div');
    downloadRow.className = 'photo-share-fallback';
    box.append(downloadRow);

    whatsappButton.textContent = 'WhatsApp par bhejo';
    whatsappButton.type = 'button';
    whatsappButton.onclick = null;

    const sources = imageSources(property);
    const imageFiles = [];
    let clipboardPng = null;
    let photosReady = false;
    const urls = [];
    function addDownload(blob, index) {
      const url = URL.createObjectURL(blob);
      urls.push(url);
      const link = document.createElement('a');
      link.className = 'outline-button';
      link.href = url;
      link.download = 'Jaggi-Property-' + (index + 1) + '.jpg';
      link.textContent = 'Download photo ' + (index + 1);
      downloadRow.append(link);
    }
    function addOpenLink(source, index) {
      const link = document.createElement('a');
      link.className = 'outline-button';
      link.href = source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Open photo ' + (index + 1);
      downloadRow.append(link);
    }

    if (sources.length) {
      status.textContent = 'Photos prepare ho rahi hain…';
      Promise.all(sources.map(async (source, index) => {
        try {
          const response = await fetch(source);
          if (!response.ok) throw new Error('Download failed');
          const blob = await response.blob();
          if (!blob.type.startsWith('image/')) throw new Error('Not an image');
          return { blob, index };
        } catch {
          return { source, index };
        }
      })).then(async results => {
        results.forEach(item => {
          if (item.blob) {
            imageFiles.push(item);
            addDownload(item.blob, item.index);
          } else {
            addOpenLink(item.source, item.index);
          }
        });
        if (imageFiles.length) {
          try {
            const first = imageFiles.find(item => item.index === 0) || imageFiles[0];
            clipboardPng = await pngFromBlob(first.blob);
          } catch {
            clipboardPng = null;
          }
        }
        photosReady = true;
        status.textContent = clipboardPng
          ? 'Photo ready hai. WhatsApp kholne ke baad ⌘V dabakar attach karna.'
          : 'WhatsApp kholkar neeche se photo download/attach karna.';
      });
    } else {
      photosReady = true;
      status.textContent = 'Is property mein abhi photo nahi hai. WhatsApp par details bhej sakte ho.';
    }

    whatsappButton.addEventListener('click', () => {
      const phone = phoneInput.value.replace(/\D/g, '');
      if (!indianMobile.test(phone)) {
        status.textContent = '10-digit Indian WhatsApp number enter karo.';
        phoneInput.focus();
        return;
      }
      // Request clipboard access in the actual user click (before opening WhatsApp).
      if (clipboardPng && navigator.clipboard?.write && window.ClipboardItem) {
        try {
          const copying = navigator.clipboard.write([
            new ClipboardItem({ 'image/png': clipboardPng })
          ]);
          copying.then(() => {
            status.textContent = 'Photo clipboard mein copied! WhatsApp chat mein ⌘V dabao aur Send karo.';
          }).catch(() => {
            status.textContent = 'WhatsApp mein neeche wali Download photo file manually attach karo.';
          });
        } catch {
          status.textContent = 'WhatsApp mein neeche wali Download photo file manually attach karo.';
        }
      } else if (!photosReady) {
        status.textContent = 'Photos abhi prepare ho rahi hain. WhatsApp mein download karke attach kar sakte ho.';
      } else {
        status.textContent = 'WhatsApp chat mein neeche wali photo download karke attach karo.';
      }
      const link = 'https://wa.me/' + getCountryCode() + phone +
        '?text=' + encodeURIComponent(propertyText(property));
      const popup = window.open(link, '_blank');
      if (!popup) window.location.href = link;
    });

    const dialog = document.querySelector('#property-dialog');
    dialog.addEventListener('close', () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    }, { once: true });
  };
})();