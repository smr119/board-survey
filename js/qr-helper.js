const COMPANY_NAME = 'هلدینگ پیشران انتخاب';
const LOGO_PATH = 'assets/logo.png';

function getSurveyUrl() {
  return new URL('index.html', window.location.href).href;
}

function renderQRImage(container, url, size = 220) {
  container.innerHTML = '';
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(url)}`;
  img.alt = 'QR Code';
  img.width = size;
  img.height = size;
  img.className = 'qr-image';
  container.appendChild(img);
  return img;
}

async function renderQRCode(container, url, size = 220) {
  container.innerHTML = '';

  if (typeof QRCode === 'function') {
    try {
      const qr = new QRCode(container, {
        text: url,
        width: size,
        height: size,
        colorDark: '#1a2332',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H,
      });
      const canvas = container.querySelector('canvas');
      if (canvas) return canvas;
      const img = container.querySelector('img');
      if (img) return img;
      void qr;
    } catch {
      container.innerHTML = '';
    }
  }

  return renderQRImage(container, url, size);
}

function getQRDataUrl(container) {
  const canvas = container.querySelector('canvas');
  if (canvas) return canvas.toDataURL('image/png');

  const img = container.querySelector('img');
  if (img && img.src.startsWith('data:')) return img.src;
  if (img) return img.src;

  return null;
}

function createCompanyBranding(className = 'company-branding') {
  const wrap = document.createElement('div');
  wrap.className = className;
  wrap.innerHTML = `
    <p class="company-label">${COMPANY_NAME}</p>
    <p class="company-subtitle">معاونت برنامه ریزی جامع</p>
    <img src="${LOGO_PATH}" alt="${COMPANY_NAME}" class="company-logo" onerror="this.style.display='none'">
  `;
  return wrap;
}

function createFooterBranding() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.appendChild(createCompanyBranding('company-branding company-branding--footer'));
  return footer;
}
