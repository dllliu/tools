const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

const STYLES = `
  :root {
    color-scheme: dark;
    --bg: #0f1115;
    --panel: #171a21;
    --line: #262b36;
    --text: #e9edf5;
    --muted: #949cad;
    --accent: #ffcb05;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2.5rem 1.25rem 4rem;
    background: var(--bg);
    color: var(--text);
    font: 16px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  main { max-width: 40rem; margin: 0 auto; }
  h1 { margin: 0 0 .25rem; font-size: 1.75rem; letter-spacing: -.01em; }
  .toggle {
    display: inline-flex; margin-bottom: 1.25rem; padding: .2rem;
    background: var(--panel); border: 1px solid var(--line); border-radius: 999px;
  }
  .toggle button {
    border: 0; background: none; color: var(--muted); cursor: pointer;
    padding: .4rem .9rem; border-radius: 999px; font: inherit; font-size: .875rem;
  }
  .toggle button[aria-pressed="true"] { background: var(--accent); color: #17181c; font-weight: 600; }
  /* Fixed layout so the two boards line up exactly and switching between
     them does not nudge the columns. */
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { text-align: left; font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); padding: 0 .5rem .5rem; font-weight: 600; }
  td { padding: .6rem .5rem; border-top: 1px solid var(--line); }
  .rank { width: 4rem; white-space: nowrap; color: var(--muted); font-variant-numeric: tabular-nums; }
  .medal { font-size: 1.1rem; line-height: 1; }
  .total { text-align: right; width: 5rem; white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 600; }
  .id { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9rem; }
  .empty { padding: 2rem 0; color: var(--muted); }
  .faq { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid var(--line); }
  /* Same small-caps treatment as the column headers, so the label reads as
     section furniture rather than as another question. */
  .faq h2 {
    margin: 0 0 .5rem; padding: 0 .5rem; font-size: .75rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: .06em; color: var(--muted);
  }
  .faq details { border-bottom: 1px solid var(--line); }
  /* list-style drops the built-in triangle, which also frees the summary to
     lay itself out as a flex row; the -webkit rule does the same in Safari. */
  .faq summary {
    display: flex; gap: .6rem; align-items: baseline; cursor: pointer;
    list-style: none; padding: .9rem .5rem; font-size: .95rem; font-weight: 600;
  }
  .faq summary::-webkit-details-marker { display: none; }
  .faq summary::before { content: '+'; color: var(--accent); font-weight: 400; }
  .faq details[open] summary::before { content: '\\2212'; }
  .faq p { margin: 0; padding: 0 .5rem 1rem 1.6rem; color: var(--muted); font-size: .9rem; max-width: 34rem; }
`;

const MEDALS = [
  { icon: '🥇', label: 'First place' },
  { icon: '🥈', label: 'Second place' },
  { icon: '🥉', label: 'Third place' },
];

/**
 * Everyone on the same score shares a place, and places run straight on from
 * there: two people tied at third are both third, and the next person down is
 * fourth. Ranking by score rather than row order also keeps a tie at the
 * cutoff from handing bronze to whoever the sort happened to put first.
 */
function withRanks(rows) {
  let rank = 0;
  let previousTotal = null;

  return rows.map((row) => {
    if (row.total !== previousTotal) {
      rank += 1;
      previousTotal = row.total;
    }
    return { ...row, rank };
  });
}

// The medal says which place it is on the podium, so the number would only
// repeat it. Below third there is no medal left to say it, so the number does.
function renderRank(rank) {
  const medal = MEDALS[rank - 1];
  if (!medal) return String(rank);
  return `<span class="medal" role="img" aria-label="${medal.label}">${medal.icon}</span>`;
}

// Rows carry a name once the directory is cached; until then the Slack id is
// all we have, so show it rather than an empty cell.
function renderRow(row) {
  const label = row.name
    ? escapeHtml(row.name)
    : `<span class="id">${escapeHtml(row.userId)}</span>`;

  return (
    `<tr><td class="rank">${renderRank(row.rank)}</td>` +
    `<td>${label}</td>` +
    `<td class="total">${row.total}</td></tr>`
  );
}

function renderBoard({ id, rows, heading, hidden }) {
  if (rows.length === 0) {
    return `<div id="${id}"${hidden ? ' hidden' : ''}><p class="empty">Nothing here yet.</p></div>`;
  }

  return (
    `<div id="${id}"${hidden ? ' hidden' : ''}>` +
    // Fixed layout takes its widths from this row, so the classes belong here.
    '<table><thead><tr><th class="rank">Rank</th><th>Who</th>' +
    `<th class="total">${heading}</th></tr></thead>` +
    `<tbody>${withRanks(rows).map(renderRow).join('')}</tbody></table></div>`
  );
}

const FAQ = [
  {
    question: 'How It Works',
    answer:
      'Snipe someone by taking a picture of them, tagging them on Slack, and ' +
      'posting it in the #web-snipes channel.',
  },
];

// Native disclosure rather than a scripted accordion: the answers still open
// with scripting off, and the keyboard and screen reader behaviour is built in.
function renderFaq() {
  const entries = FAQ.map(
    ({ question, answer }) =>
      `<details><summary>${escapeHtml(question)}</summary>` +
      `<p>${escapeHtml(answer)}</p></details>`,
  ).join('');

  return (
    '<section class="faq" aria-labelledby="faq-title">' +
    '<h2 id="faq-title">Frequently Asked Questions</h2>' +
    `${entries}</section>`
  );
}

function renderDashboard({ snipers, sniped }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Snipes leaderboard</title>
<style>${STYLES}</style>
</head>
<body>
<main>
  <h1 id="title">Snipes Leaderboard</h1>
  <div class="toggle">
    <button type="button" data-board="snipers" aria-pressed="true">Top snipers</button>
    <button type="button" data-board="sniped" aria-pressed="false">Top victims</button>
  </div>

  ${renderBoard({ id: 'board-snipers', rows: snipers, heading: 'Snipes' })}
  ${renderBoard({ id: 'board-sniped', rows: sniped, heading: 'Sniped', hidden: true })}

  ${renderFaq()}
</main>

<script>
  const TITLES = { snipers: 'Snipes Leaderboard', sniped: 'Victims Leaderboard' };

  // Both boards ship with the page, so the toggle is a visibility flip and
  // the default one still renders with scripting off.
  document.querySelector('.toggle').addEventListener('click', (event) => {
    const picked = event.target.dataset.board;
    if (!picked) return;

    document.querySelectorAll('.toggle button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.board === picked));
    });
    document.getElementById('board-snipers').hidden = picked !== 'snipers';
    document.getElementById('board-sniped').hidden = picked !== 'sniped';
    document.getElementById('title').textContent = TITLES[picked];
  });
</script>
</body>
</html>
`;
}

module.exports = { renderDashboard };
