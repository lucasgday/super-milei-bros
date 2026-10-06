(() => {
  const count = document.getElementById('visitorCount');
  if (!count) return;
  fetch('/api/visitors', { method: 'POST', keepalive: true })
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data || !Number.isFinite(data.visitors)) return;
      count.textContent = `${data.visitors.toLocaleString('es-AR')} VISITANTES ÚNICOS HOY ·`;
      count.hidden = false;
    })
    .catch(() => {});
})();
