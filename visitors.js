(() => {
  const count = document.getElementById('visitorCount');
  if (!count) return;
  fetch('/api/visitors', { method: 'POST', keepalive: true })
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data || !Number.isFinite(data.visitors)) return;
      const label = data.visitors === 1 ? 'VISITANTE ÚNICO' : 'VISITANTES ÚNICOS';
      count.textContent = `${data.visitors.toLocaleString('es-AR')} ${label} HOY ·`;
      count.hidden = false;
    })
    .catch(() => {});
})();
