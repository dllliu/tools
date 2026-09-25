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
  .sub { margin: 0 0 1.75rem; color: var(--muted); font-size: .9rem; }
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
  .rank { width: 2.5rem; }
  .medal { font-size: 1.2rem; line-height: 1; }
  .total { text-align: right; width: 5rem; white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 600; }
  .id { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9rem; }
  .empty { padding: 2rem 0; color: var(--muted); }
`;

const MEDALS = [
  { icon: '🥇', label: 'First place' },
  { icon: '🥈', label: 'Second place' },
  { icon: '🥉', label: 'Third place' },
];

/**
 * Competition ranking: everyone on the same score shares a place, and the next
 * score skips the places they used up. Without this a tie at the cutoff would
 * hand bronze to whichever row the sort happened to put first.
 */
function withRanks(rows) {
  let rank = 0;
  let previousTotal = null;

  return rows.map((row, index) => {
    if (row.total !== previousTotal) {
      rank = index + 1;
      previousTotal = row.total;
    }
    return { ...row, rank };
  });
}

// Only the podium is marked. Everyone else keeps the empty cell so their
// names stay lined up with the top three.
function renderRank(rank) {
  const medal = MEDALS[rank - 1];
  if (!medal) return '';
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
    '<table><thead><tr><th class="rank"></th><th>Who</th>' +
    `<th class="total">${heading}</th></tr></thead>` +
    `<tbody>${withRanks(rows).map(renderRow).join('')}</tbody></table></div>`
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
  <h1>Snipes leaderboard</h1>
  <div class="toggle">
    <button type="button" data-board="snipers" aria-pressed="true">Top snipers</button>
    <button type="button" data-board="sniped" aria-pressed="false">Top victims</button>
  </div>

  ${renderBoard({ id: 'board-snipers', rows: snipers, heading: 'Snipes' })}
  ${renderBoard({ id: 'board-sniped', rows: sniped, heading: 'Sniped', hidden: true })}
</main>

<script>
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
  });
</script>
</body>
</html>
`;
}

module.exports = { renderDashboard };
