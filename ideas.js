(() => {
  'use strict';

  const button = document.getElementById('ideasButton');
  const panel = document.getElementById('ideasPanel');
  const closeButton = document.getElementById('ideasClose');
  const list = document.getElementById('ideasList');
  const status = document.getElementById('ideasStatus');
  const form = document.getElementById('ideaForm');
  const intro = panel.querySelector('.ideas-intro');
  const rankingPanel = document.getElementById('rankingPanel');
  const mobileLayout = window.matchMedia('(max-width: 780px), (hover: none) and (pointer: coarse)');
  let ideas = [];
  let available = false;
  let paymentEnabled = false;
  let loading = false;
  const returnStatus = new URLSearchParams(window.location.search).get('vote');

  function syncLayout() {
    panel.hidden = mobileLayout.matches;
    if (mobileLayout.matches) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
    } else {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }
  }

  function close() {
    if (panel.hidden) return;
    panel.hidden = true;
    button.focus();
  }

  function render() {
    list.replaceChildren();
    for (const idea of [...ideas].sort((a, b) => b.votes - a.votes)) {
      const row = document.createElement('article');
      row.className = 'idea-row';
      const content = document.createElement('div');
      const heading = document.createElement('h3');
      const description = document.createElement('p');
      const vote = document.createElement('button');
      heading.textContent = idea.title;
      description.textContent = idea.description;
      vote.type = 'button';
      vote.className = 'idea-vote';
      vote.textContent = paymentEnabled ? `▲ ARS 1.000 · ${idea.votes}` : `▲ ${idea.votes} · PRÓXIMAMENTE`;
      vote.setAttribute('aria-label', paymentEnabled
        ? `Apoyar ${idea.title} con ARS 1.000. ${idea.votes} votos confirmados.`
        : `${idea.title}: ${idea.votes} votos confirmados. Próximamente.`);
      vote.disabled = !paymentEnabled;
      vote.addEventListener('click', () => submitVote(idea, vote));
      content.append(heading, description);
      row.append(content, vote);
      list.append(row);
    }
  }

  async function load() {
    if (loading) return;
    loading = true;
    const live = fetch('/api/ideas').then(async response => {
      if (!response.ok) throw new Error();
      return response.json();
    }).catch(() => null);
    try {
      const response = await fetch('./ideas.json', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      ideas = (await response.json()).map(idea => ({ ...idea, votes: 0 }));
      status.textContent = 'Actualizando votos…';
      render();
    } catch {
      status.textContent = 'Actualizando propuestas…';
    }
    const data = await live;
    if (data) {
      ideas = data.ideas;
      available = data.available;
      paymentEnabled = data.paymentEnabled;
      intro.textContent = paymentEnabled
        ? 'Apoyá las ideas que querés ver en el juego. Cada voto cuesta ARS 1.000 y se cuenta sólo cuando Mercado Pago confirma el pago. Las propuestas nuevas se revisan antes de publicarse.'
        : 'Elegí qué ideas te gustaría ver en el juego. Las propuestas nuevas se revisan antes de publicarse.';
      form.hidden = !available;
      status.textContent = paymentEnabled ? '' : available ? 'Los votos pagos estarán disponibles pronto.' : 'Votos y envíos disponibles en la versión online.';
      render();
    } else {
      available = false;
      paymentEnabled = false;
      form.hidden = true;
      status.textContent = ideas.length ? 'Votos y envíos no disponibles en este momento.' : 'No pudimos cargar las propuestas. Probá de nuevo más tarde.';
      render();
    }
    if (returnStatus === 'success' || returnStatus === 'pending') {
      status.textContent = 'Si completaste el pago, el voto aparecerá cuando Mercado Pago lo confirme.';
      if (mobileLayout.matches) panel.hidden = false;
    } else if (returnStatus === 'failure') {
      status.textContent = 'El retorno indica que el pago no se completó. Sólo cuentan pagos confirmados.';
      if (mobileLayout.matches) panel.hidden = false;
    }
    loading = false;
  }

  async function submitVote(idea, vote) {
    vote.disabled = true;
    status.textContent = 'Abriendo Mercado Pago…';
    try {
      const response = await fetch('/api/paid-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idea.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo iniciar el pago.');
      window.location.assign(result.url);
    } catch (error) {
      status.textContent = error.message;
      vote.disabled = false;
    }
  }

  button.addEventListener('click', () => {
    rankingPanel.hidden = true;
    if (!mobileLayout.matches) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      panel.focus({ preventScroll: true });
      return;
    }
    panel.hidden = false;
    closeButton.focus();
  });
  closeButton.addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (!mobileLayout.matches || panel.hidden) return;
    if (event.key === 'Escape') { close(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...panel.querySelectorAll('button:not(:disabled), input, textarea')].filter(element => !element.closest('[hidden]'));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Enviando propuesta…';
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest', title: form.elements.title.value, description: form.elements.description.value }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo enviar la propuesta.');
      form.reset();
      status.textContent = result.message;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
  mobileLayout.addEventListener('change', syncLayout);
  syncLayout();
  load();
})();
