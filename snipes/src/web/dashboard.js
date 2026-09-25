const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

// Lora and Open Sans are the pairing every Daily graphics project loads, and
// the blue and maize are the house colours. Chronicle Display sets the
// headlines on michigandaily.com, but it is licensed through the main site's
// font kit, so Lora bold stands in here as it does in the other projects.
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400' +
  '&family=Open+Sans:ital,wght@0,400;0,700;1,400&display=swap';

// The Daily's flag mark, tinted to the house blue the way logo-blue-small.svg
// is in the orientation edition; the shipped file carries no fill of its own.
const LOGO_SRC =
  "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2025.93%2022.11'%3e%3cg%20id='Layer_2'%20data-name='Layer%202'%3e%3cg%20id='Layer_1-2'%20data-name='Layer%201'%3e%3cpath%20fill='%2300274c'%20d='M9.09,2.68V6.83c0,.64,0,1.28,0,1.92,0,.09.1.25.16.25C10,9,10.82,9,11.6,9a.54.54,0,0,0,0-.12c0-1.43,0-2.85,0-4.28a.4.4,0,0,0-.18-.25c-.46-.31-.93-.58-1.37-.89s-.63-.5-1-.79M19.65,9V8.59c0-1.32,0-2.63,0-3.95,0-.37-.05-.63-.45-.73a1.39,1.39,0,0,1-.43-.23l-1.25-.84a.73.73,0,0,0-.48.85c0,.48,0,1,0,1.44,0,1.19,0,2.37,0,3.56,0,.11.1.3.16.31.79,0,1.59,0,2.42,0M16.52,3.55c-.27.19-.48.36-.71.5a.64.64,0,0,0-.32.62q0,6.27,0,12.55a1.13,1.13,0,0,0,0,.26c0,.07.07.17.13.19.28.11.57.2.89.3Zm-8-.48a2,2,0,0,0-1,1.77c0,1.57,0,3.14,0,4.71,0,1,0,2,0,3a4.16,4.16,0,0,1-2.73,4.29c-.49.22-1,.4-1.48.62-.3.13-.47,0-.59-.27.13-.12.27-.24.39-.37a2.38,2.38,0,0,0,.75-1.56c0-1,0-2,0-3a1.26,1.26,0,0,0-1.62,1c-.12.38-.25.41-.53.13A2.72,2.72,0,0,1,1,10.79,2.2,2.2,0,0,1,3.06,9.07L3.91,9c0-.43,0-.84,0-1.25A3.69,3.69,0,0,1,5.34,4.59C6.44,3.73,7.57,2.92,8.7,2.1,9.54,1.49,10.39.9,11.24.3L11.65,0c.69.52,1.34,1.05,2,1.51s1.49.87,2.24,1.28c.35.19.61,0,.62-.4V1.1c0-.42,0-.42.5-.37V2.2l.08,0L20.19,0a13,13,0,0,0,4.66,2.21,2.06,2.06,0,0,1-.2.33c-.33.39-.68.77-1,1.16a.76.76,0,0,0-.15.41q0,6.27,0,12.55A2.18,2.18,0,0,0,24,18.11a1.05,1.05,0,0,0,1.48.22c.1-.07.28,0,.43,0a.5.5,0,0,0,0,.12l-1.5,2.13-.95,1.33c-.07.09-.25.19-.33.16a4.7,4.7,0,0,1-2.72-1.71,4.92,4.92,0,0,1-.75-2.8c0-1.69,0-3.38,0-5.06,0-.07,0-.13,0-.22a2.07,2.07,0,0,0-.22,0H17.36c-.23,0-.31.07-.31.3,0,1.83,0,3.66,0,5.49,0,.31.18.42.38.54s.3.3.09.56C16.8,20,16.1,21,15.4,21.87l-.19.21c-1.31-1.37-3-1.71-4.87-1.89a2.21,2.21,0,0,1,.2-.36c.32-.38.66-.75,1-1.15a.83.83,0,0,0,.17-.46c0-1.89,0-3.77,0-5.66,0-.24-.06-.34-.33-.34-.64,0-1.29,0-1.93,0-.27,0-.35.08-.35.35,0,2,0,4,0,5.95a5.9,5.9,0,0,1-.37,1.81A2.55,2.55,0,0,1,5.56,22a8.37,8.37,0,0,1-1.65-.6,3,3,0,0,0-3.57.47A.29.29,0,0,1,.12,22c-.06,0-.14-.17-.12-.23a4.58,4.58,0,0,1,2.34-3.15,3.31,3.31,0,0,1,2.82.06c.42.19.83.41,1.25.58a2.27,2.27,0,0,0,.73.16,1.15,1.15,0,0,0,1.27-.9,3.94,3.94,0,0,0,.15-1q0-7.08,0-14.15c0-.07,0-.13,0-.24'/%3e%3c/g%3e%3c/g%3e%3c/svg%3e";

const STYLES = `
  :root {
    color-scheme: light;
    --paper: #fbfaf6;
    --ink: #00274c;
    --muted: #5c6672;
    --rule: #d5cfc2;
    --maize: #ffcb05;
    --serif: Lora, Georgia, "Times New Roman", serif;
    --sans: "Open Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2.5rem 1.25rem 4rem;
    background: var(--paper);
    color: var(--ink);
    font: 16px/1.6 var(--serif);
  }
  main { max-width: 40rem; margin: 0 auto; }
  /* A nameplate rule and the hairline under it, the pairing a newspaper uses
     to fence the masthead off from the page. */
  .masthead { margin-bottom: 1.5rem; padding-bottom: 3px; border-bottom: 1px solid var(--ink); }
  .nameplate {
    display: flex; align-items: center; gap: .7rem;
    padding-bottom: .4rem; border-bottom: 3px solid var(--ink);
  }
  /* Flag first, then the title, the way the mark sits beside a nameplate in
     print. The intrinsic size on the img holds the space while it decodes. */
  .nameplate a { display: flex; flex: none; }
  .nameplate img { display: block; width: auto; height: clamp(1.9rem, 6.5vw, 2.5rem); }
  h1 { margin: 0; font-size: clamp(2rem, 7vw, 2.75rem); font-weight: 700; line-height: 1.1; }
  /* Section tabs rather than a switch: the maize underline marks the live one
     the way the paper marks the section you are reading. */
  .toggle { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; }
  .toggle button {
    border: 0; border-bottom: 3px solid transparent; background: none;
    cursor: pointer; padding: .3rem 0; color: var(--muted);
    font: 700 .78rem var(--sans); text-transform: uppercase; letter-spacing: .08em;
  }
  .toggle button[aria-pressed="true"] { color: var(--ink); border-bottom-color: var(--maize); }
  /* Fixed layout so the two boards line up exactly and switching between
     them does not nudge the columns. */
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th {
    text-align: left; padding: 0 .5rem .45rem; color: var(--muted);
    border-bottom: 2px solid var(--ink);
    font: 700 .7rem var(--sans); text-transform: uppercase; letter-spacing: .08em;
  }
  td { padding: .65rem .5rem; border-top: 1px solid var(--rule); }
  /* The header already draws a rule, so the first row would double it. */
  tbody tr:first-child td { border-top: 0; }
  .rank { width: 4rem; white-space: nowrap; color: var(--muted); font-variant-numeric: tabular-nums; }
  .medal { font-size: 1.1rem; line-height: 1; }
  .total { text-align: right; width: 5rem; white-space: nowrap; font-variant-numeric: tabular-nums; font-weight: 700; }
  .id { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9rem; }
  .empty { padding: 2rem 0; color: var(--muted); }
  .faq { margin-top: 3rem; padding-top: 1.25rem; border-top: 3px solid var(--ink); }
  /* Same small-caps treatment as the column headers, so the label reads as
     section furniture rather than as another question. */
  .faq h2 {
    margin: 0 0 .5rem; padding: 0 .5rem; color: var(--muted);
    font: 700 .7rem var(--sans); text-transform: uppercase; letter-spacing: .08em;
  }
  .faq details { border-bottom: 1px solid var(--rule); }
  /* list-style drops the built-in triangle, which also frees the summary to
     lay itself out as a flex row; the -webkit rule does the same in Safari. */
  .faq summary {
    display: flex; gap: .6rem; align-items: baseline; cursor: pointer;
    list-style: none; padding: .8rem .5rem; font-size: 1.05rem; font-weight: 700;
  }
  .faq summary::-webkit-details-marker { display: none; }
  .faq summary::before { content: '+'; color: var(--muted); font-weight: 400; }
  .faq details[open] summary::before { content: '\\2212'; }
  .faq p { margin: 0; padding: 0 .5rem 1.1rem 1.6rem; font-size: .95rem; max-width: 34rem; }
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
    question: 'How does this work?',
    answer:
      'Snipe someone by taking a picture of them, tagging them on Slack, and ' +
      'posting it in the #web-snipes channel.',
  },
  {
    question: 'How will this data be used?',
    answer:
      'The snipes/sniped count will be aggregated per user per week and per semester.' + 
      'Data will be cleared and reset every semester.',
  },
  {
    question: 'Not seeing your question here?',
    answer:
    'DM Daniel Liu on Slack.',
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS_HREF}">
<style>${STYLES}</style>
</head>
<body>
<main>
  <header class="masthead">
    <div class="nameplate">
      <a href="https://www.michigandaily.com">
        <img src="${LOGO_SRC}" alt="The Michigan Daily logo" width="26" height="22">
      </a>
      <h1 id="title">Snipes Leaderboard</h1>
    </div>
  </header>
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
