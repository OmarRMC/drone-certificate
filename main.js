(function () {
  'use strict';

  const DATA_URL   = './certificates.json';
  const PARAM_NAME = 'id';

  const resultEl = document.getElementById('verifier-result');
  const inputEl  = document.getElementById('cert-id');
  const btnEl    = document.getElementById('verify-btn');

  // ── Date utilities ──────────────────────────────────────────
  function formatDate(isoStr) {
    const [y, m, d] = isoStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-BO', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  //── Data fetch (cached) ──────────────────────────────────────
  let certCache = null;

  async function loadCertificates() {
    if (certCache) return certCache;
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('No se pudo cargar los datos de certificados.');
    certCache = await res.json();
    return certCache;
  }

  function findCert(data, id) {
    return data.certificates.find(
      c => c.id.trim().toUpperCase() === id.trim().toUpperCase()
    );
  }

  // ── Render helpers ───────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&#039;');
  }

  function svgCheck() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
  }
function svgError() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
  }

  // ── Render result states ─────────────────────────────────────
  function renderResult(cert) {
    resultEl.innerHTML = `
      <div class="result-card result-card--success">
        <div class="result-card__icon">${svgCheck()}</div>
        <div class="result-card__body">
          <span class="result-card__badge">Certificado Vigente</span>
          <h3 class="result-card__name">${escHtml(cert.nombre)}</h3>
          <dl class="result-card__details">
            <dt>Curso</dt>      <dd>${escHtml(cert.curso)}</dd>
            <dt>Nivel</dt>      <dd>${escHtml(cert.nivel)}</dd>
            <dt>Profesión</dt>  <dd>${escHtml(cert.profesion)}</dd>
            <dt>Uso</dt>        <dd>${escHtml(cert.uso)}</dd>
            <dt>Drone</dt>      <dd>${escHtml(cert.drone)}</dd>
            <dt>Emitido</dt>    <dd>${formatDate(cert.fecha_emision)}</dd>
          </dl>
        </div>
      </div>`;

    resultEl.removeAttribute('hidden');
  }

  function renderNotFound() {
    resultEl.innerHTML = `
      <div class="result-card result-card--error">
        <div class="result-card__icon">${svgError()}</div>
        <div class="result-card__body">
          <span class="result-card__badge">No Encontrado</span>
          <p class="result-card__message">
            No se encontró ningún certificado con ese código.<br>
            Verifica el código impreso en tu certificado e inténtalo nuevamente.
          </p>
        </div>
      </div>`;
    resultEl.removeAttribute('hidden');
  }

  function renderLoading() {
    resultEl.innerHTML = `
      <div class="verifier__loading">
        <div class="spinner"></div>
        <p>Verificando certificado…</p>
      </div>`;
    resultEl.removeAttribute('hidden');
  }

  function renderFetchError(msg) {
    resultEl.innerHTML = `
      <div class="result-card result-card--error">
        <div class="result-card__icon">${svgError()}</div>
        <div class="result-card__body">
          <span class="result-card__badge">Error</span>
          <p class="result-card__message">${escHtml(msg)}</p>
        </div>
      </div>`;
    resultEl.removeAttribute('hidden');
  }

  // ── Main verify function ─────────────────────────────────────
  async function verifyCertificate(id) {
    if (!id || id.trim() === '') return;

    renderLoading();
    btnEl.disabled = true;

    try {
      const data = await loadCertificates();
      const cert = findCert(data, id);
      cert ? renderResult(cert) : renderNotFound();
    } catch (err) {
      renderFetchError(err.message);
    } finally {
      btnEl.disabled = false;
    }
  }

  // ── Event listeners ──────────────────────────────────────────
  btnEl.addEventListener('click', () => verifyCertificate(inputEl.value));

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') verifyCertificate(inputEl.value);
  });

  // ── Auto-verify from QR URL param ───────────────────────────
  const params = new URLSearchParams(window.location.search);
  const urlId  = params.get(PARAM_NAME);
  if (urlId) {
    inputEl.value = urlId;
    document.getElementById('verificar').scrollIntoView({ behavior: 'smooth' });
    verifyCertificate(urlId);
  }

  // ── Clean URL hash after lightbox close ─────────────────────
  document.querySelectorAll('.lightbox__close, .lightbox__backdrop').forEach(el => {
    el.addEventListener('click', () => {
      if (history.replaceState) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
  });

})();
