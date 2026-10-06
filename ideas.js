(() => {
  'use strict';

  const button = document.getElementById('ideasButton');
  const panel = document.getElementById('ideasPanel');
  const closeButton = document.getElementById('ideasClose');
  const list = document.getElementById('ideasList');
  const status = document.getElementById('ideasStatus');
  const form = document.getElementById('ideaForm');
  const rankingPanel = document.getElementById('rankingPanel');
  let ideas = [];
  let available = false;

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
      vote.textContent = idea.voted ? `✓ VOTADO · ${idea.votes}` : `▲ VOTAR · ${idea.votes}`;
      vote.setAttribute('aria-label', `${idea.voted ? 'Ya votaste' : 'Votar'}: ${idea.title}, ${idea.votes} votos`);
      vote.disabled = !available || idea.voted;
      vote.addEventListener('click', () => submitVote(idea, vote));
      content.append(heading, description);
      row.append(content, vote);
      list.append(row);
    }
  }

  async function load() {
    status.textContent = 'Cargando propuestas…';
    try {
      const response = await fetch('/api/ideas');
      if (!response.ok) throw new Error();
      const data = await response.json();
      ideas = data.ideas;
      available = data.available;
      form.hidden = !available;
      status.textContent = available ? '' : 'Votos y envíos disponibles en la versión online.';
      render();
    } catch {
      try {
        const response = await fetch('./ideas.json');
        if (!response.ok) throw new Error();
        ideas = (await response.json()).map(idea => ({ ...idea, votes: 0, voted: false }));
        available = false;
        form.hidden = true;
        status.textContent = 'Votos y envíos no disponibles en este momento.';
        render();
      } catch {
        status.textContent = 'No pudimos cargar las propuestas. Probá de nuevo más tarde.';
      }
    }
  }

  async function submitVote(idea, vote) {
    vote.disabled = true;
    status.textContent = 'Registrando voto…';
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', id: idea.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo registrar el voto.');
      idea.votes = result.votes;
      idea.voted = true;
      status.textContent = '¡Voto registrado!';
      render();
    } catch (error) {
      await load();
      status.textContent = error.message;
    }
  }

  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      rankingPanel.hidden = true;
      closeButton.focus();
      load();
    }
  });
  closeButton.addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) close();
    if (event.key !== 'Tab' || panel.hidden) return;
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
})();
