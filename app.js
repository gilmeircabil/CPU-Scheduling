/**
 * CPU Scheduling Simulator - UI Logic
 * Handles DOM manipulation, event handling, and rendering
 * Imports: scheduler.js (algorithm functions)
 */

import { validateProcesses, runScheduler } from './scheduler.js';

// ============== DOM ==============

const $ = (id) => document.getElementById(id);

const el = {
  themeToggle: $('theme-toggle'),
  addRow: $('add-row'),
  loadSample: $('load-sample'),
  clearAll: $('clear-all'),
  processTable: $('process-table'),
  processBody: $('process-body'),
  columnHint: $('column-hint'),
  errors: $('validation-errors'),
  quantum: $('quantum'),
  quantumField: $('quantum-field'),
  run: $('run-simulation'),
  gantt: $('gantt'),
  ganttKey: $('gantt-key'),
  timelineSub: $('timeline-sub'),
  resultsBody: $('results-body'),
  avgWaiting: $('avg-waiting'),
  avgTurnaround: $('avg-turnaround'),
  avgResponse: $('avg-response'),
  utilisation: $('utilisation'),
  log: $('log-content'),
  compareBtn: $('compare-selected'),
  compareControls: $('comparison-controls'),
  compareHint: $('compare-hint'),
  compareTable: $('compare-table'),
  compareBody: $('comparison-body')
};

const ALGORITHMS = {
  'fcfs': { name: 'FCFS', full: 'First come, first served' },
  'sjf': { name: 'SJF', full: 'Shortest job first' },
  'srtf': { name: 'SRTF', full: 'Shortest remaining time' },
  'priority-nonpreemptive': { name: 'Priority', full: 'Priority', usesPriority: true },
  'priority-preemptive': { name: 'Priority (P)', full: 'Priority, preemptive', usesPriority: true },
  'round-robin': { name: 'RR', full: 'Round robin', usesQuantum: true },
  'multilevel-queue': { name: 'MLQ', full: 'Multilevel queue', usesQuantum: true, usesQueue: true },
  'multilevel-feedback-queue': { name: 'MLFQ', full: 'Multilevel feedback queue', usesQuantum: true, usesQueue: true }
};

const PROCESS_COLOURS = 8;

const SAMPLE_DATA = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 2, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 2 },
  { pid: 'P3', arrival: 2, burst: 8, priority: 3, queue: 3 },
  { pid: 'P4', arrival: 4, burst: 2, priority: 2, queue: 1 }
];

// State
let pidCounter = 0;
let hasRun = false;

// ============== Theme ==============

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  el.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

el.themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// ============== Helpers ==============

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function selectedAlgorithm() {
  return document.querySelector('input[name="algorithm"]:checked').value;
}

/** Colour is assigned by row order so it stays stable while editing. */
function colourMap() {
  const map = new Map();
  el.processBody.querySelectorAll('tr').forEach((row, i) => {
    map.set(row.dataset.pid, `var(--p${(i % PROCESS_COLOURS) + 1})`);
  });
  return map;
}

// ============== Workload table ==============

function addProcessRow(p = null) {
  const pid = p ? p.pid : `P${++pidCounter}`;
  const row = document.createElement('tr');
  row.dataset.pid = pid;
  row.innerHTML = `
    <td><span class="pid-tag">${escapeHtml(pid)}</span></td>
    <td><input type="number" class="arrival-input" min="0" inputmode="numeric" value="${p?.arrival ?? 0}" aria-label="${pid} arrival time"></td>
    <td><input type="number" class="burst-input" min="1" inputmode="numeric" value="${p?.burst ?? 4}" aria-label="${pid} burst time"></td>
    <td data-cell="priority"><input type="number" class="priority-input" min="1" inputmode="numeric" value="${p?.priority ?? 1}" aria-label="${pid} priority"></td>
    <td data-cell="queue">
      <select class="queue-input" aria-label="${pid} queue">
        <option value="1"${p?.queue === 1 ? ' selected' : ''}>1</option>
        <option value="2"${p?.queue === 2 ? ' selected' : ''}>2</option>
        <option value="3"${p?.queue === 3 ? ' selected' : ''}>3</option>
      </select>
    </td>
    <td><button type="button" class="remove-btn" aria-label="Remove ${pid}" title="Remove ${pid}">&times;</button></td>
  `;
  el.processBody.appendChild(row);
  paintRowColours();
  updateColumnRelevance();
  return row;
}

function paintRowColours() {
  const colours = colourMap();
  el.processBody.querySelectorAll('tr').forEach((row) => {
    row.querySelector('.pid-tag').style.setProperty('--c', colours.get(row.dataset.pid));
  });
}

function getProcessData() {
  return Array.from(el.processBody.querySelectorAll('tr')).map((row) => ({
    pid: row.dataset.pid,
    arrival: parseInt(row.querySelector('.arrival-input').value, 10),
    burst: parseInt(row.querySelector('.burst-input').value, 10),
    priority: parseInt(row.querySelector('.priority-input').value, 10),
    queue: parseInt(row.querySelector('.queue-input').value, 10)
  }));
}

function resetTable(data) {
  el.processBody.innerHTML = '';
  pidCounter = 0;
  data.forEach((p) => {
    addProcessRow(p);
    pidCounter = Math.max(pidCounter, parseInt(p.pid.replace(/\D/g, ''), 10) || 0);
  });
}

el.processBody.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-btn');
  if (!btn) return;
  const row = btn.closest('tr');
  const next = row.nextElementSibling || row.previousElementSibling;
  row.remove();
  paintRowColours();
  // Keep keyboard focus in the table after removing a row
  (next?.querySelector('.remove-btn') || el.addRow).focus();
  onWorkloadChanged();
});

el.addRow.addEventListener('click', () => {
  const row = addProcessRow();
  row.querySelector('.arrival-input').focus();
  onWorkloadChanged();
});

el.loadSample.addEventListener('click', () => {
  resetTable(SAMPLE_DATA);
  onWorkloadChanged();
});

el.clearAll.addEventListener('click', () => {
  resetTable([]);
  addProcessRow();
  hasRun = false;
  clearOutputs();
  validate();
});

// ============== Policy-aware form ==============

function updateColumnRelevance() {
  const algo = ALGORITHMS[selectedAlgorithm()];
  const toggle = (col, used) => {
    el.processTable.querySelectorAll(`[data-col="${col}"], [data-cell="${col}"]`).forEach((n) => {
      n.classList.toggle('unused', !used);
    });
  };
  toggle('priority', !!algo.usesPriority);
  toggle('queue', !!algo.usesQueue);

  const ignored = [];
  if (!algo.usesPriority) ignored.push('priority');
  if (!algo.usesQueue) ignored.push('queue');
  el.columnHint.textContent = ignored.length
    ? `${algo.full} ignores ${ignored.join(' and ')}.`
    : '';

  el.quantumField.classList.toggle('off', !algo.usesQuantum);
  el.quantum.disabled = !algo.usesQuantum;
  el.quantumField.title = algo.usesQuantum ? '' : 'Only used by round robin, MLQ and MLFQ';
}

document.querySelectorAll('input[name="algorithm"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    updateColumnRelevance();
    if (hasRun) runSimulation(false);
  });
});

// ============== Validation ==============

function validate() {
  const data = getProcessData();
  const { valid, errors } = validateProcesses(data, { quantum: parseInt(el.quantum.value, 10) });

  // Mark the offending inputs so the error is findable, not just listed
  el.processBody.querySelectorAll('input').forEach((i) => i.removeAttribute('aria-invalid'));
  el.quantum.removeAttribute('aria-invalid');
  errors.forEach((msg) => {
    const m = msg.match(/^Row (\d+): (\w+)/);
    if (m) {
      const row = el.processBody.querySelectorAll('tr')[parseInt(m[1], 10) - 1];
      const field = { Arrival: '.arrival-input', Burst: '.burst-input', Priority: '.priority-input' }[m[2]];
      if (row && field) row.querySelector(field).setAttribute('aria-invalid', 'true');
    } else if (msg.startsWith('Time quantum')) {
      el.quantum.setAttribute('aria-invalid', 'true');
    }
  });

  const rows = el.processBody.querySelectorAll('tr');
  const pretty = errors.map((msg) =>
    msg.replace(/^Row (\d+):/, (_, n) => `${rows[n - 1]?.dataset.pid ?? 'Row ' + n}:`)
  );
  if (data.length === 0) pretty.push('Add at least one process to run the simulation.');

  el.errors.innerHTML = pretty.map((e) => `<li>${escapeHtml(e)}</li>`).join('');
  const ok = valid && data.length > 0;
  el.run.disabled = !ok;
  el.compareBtn.disabled = !ok;
  return ok ? data : null;
}

function onWorkloadChanged() {
  const data = validate();
  if (data && hasRun) runSimulation(false);
}

el.processBody.addEventListener('input', onWorkloadChanged);
el.quantum.addEventListener('input', onWorkloadChanged);

// ============== Rendering ==============

function clearOutputs() {
  el.gantt.innerHTML = '<div class="empty"><p>Add processes and run the simulation to draw the timeline.</p></div>';
  el.ganttKey.hidden = true;
  el.timelineSub.textContent = 'No run yet';
  el.resultsBody.innerHTML = '<tr><td colspan="7" class="empty-cell">Results appear here after a run.</td></tr>';
  [el.avgWaiting, el.avgTurnaround, el.avgResponse, el.utilisation].forEach((n) => (n.textContent = '–'));
  el.log.innerHTML = '<li class="log-empty">Scheduler events appear here after a run.</li>';
  el.compareTable.hidden = true;
  el.compareHint.textContent = '';
}

function renderTimeline(result, data, algoKey, animate) {
  const colours = colourMap();
  const total = Math.max(...result.gantt.map((g) => g.end));
  const step = total <= 30 ? 1 : total <= 60 ? 2 : total <= 150 ? 5 : 10;

  const seg = (g, cls = '') => {
    const label = g.isIdle ? 'idle' : escapeHtml(g.pid);
    const style = `--s:${g.start};--e:${g.end};${g.isIdle ? '' : `--c:${colours.get(g.pid)}`}`;
    const title = g.isIdle ? `Idle ${g.start}–${g.end}` : `${g.pid} runs ${g.start}–${g.end}`;
    return `<div class="seg ${g.isIdle ? 'idle' : ''} ${cls}" style="${style}" title="${title}">${label}</div>`;
  };

  // CPU lane
  let html = `<div class="lane-label cpu">CPU</div><div class="lane cpu-lane">${result.gantt.map((g) => seg(g)).join('')}</div>`;

  // One lane per process: arrival marker, waiting band, run segments
  data.forEach((p) => {
    const runs = result.gantt.filter((g) => !g.isIdle && g.pid === p.pid);
    const done = result.processes.find((r) => r.pid === p.pid)?.completion ?? p.arrival;
    const c = colours.get(p.pid);
    html += `<div class="lane-label">${escapeHtml(p.pid)}</div>
      <div class="lane" style="--c:${c}">
        <div class="wait" style="--s:${p.arrival};--e:${done}" title="${p.pid} in system ${p.arrival}–${done}"></div>
        <div class="arrive" style="--s:${p.arrival}" title="${p.pid} arrives at ${p.arrival}"></div>
        ${runs.map((g) => seg(g)).join('')}
      </div>`;
  });

  // Time axis
  const ticks = [];
  for (let t = 0; t <= total; t += step) ticks.push(t);
  if (ticks[ticks.length - 1] !== total) ticks.push(total);
  html += `<div></div><div class="axis">${ticks
    .map((t) => `<span class="tick${t === 0 || t === total ? ' edge' : ''}" style="--t:${t}">${t}</span>`)
    .join('')}</div>`;

  el.gantt.innerHTML = `<div class="gantt-grid${animate ? ' animate' : ''}" style="--units:${total}" role="img" aria-label="${escapeHtml(timelineDescription(result))}">${html}</div>`;
  el.ganttKey.hidden = false;

  const algo = ALGORITHMS[algoKey];
  const q = algo.usesQuantum ? `, quantum ${el.quantum.value}` : '';
  el.timelineSub.textContent = `${algo.full}${q}. Finishes at t = ${total}.`;
}

function timelineDescription(result) {
  return 'CPU schedule: ' + result.gantt
    .map((g) => `${g.isIdle ? 'idle' : g.pid} from ${g.start} to ${g.end}`)
    .join(', ');
}

function renderResults(result, data) {
  const colours = colourMap();
  const order = new Map(data.map((p, i) => [p.pid, i]));
  const rows = [...result.processes].sort((a, b) => order.get(a.pid) - order.get(b.pid));

  el.resultsBody.innerHTML = rows.map((p) => `
    <tr>
      <td><span class="pid-tag" style="--c:${colours.get(p.pid)}">${escapeHtml(p.pid)}</span></td>
      <td>${p.arrival}</td>
      <td>${p.burst}</td>
      <td>${p.completion}</td>
      <td>${fmt(p.turnaround)}</td>
      <td>${fmt(p.waiting)}</td>
      <td>${fmt(p.response)}</td>
    </tr>`).join('');

  const a = result.averages;
  const total = Math.max(...result.gantt.map((g) => g.end));
  const start = Math.min(...result.gantt.map((g) => g.start));
  const span = total - start;
  el.avgWaiting.textContent = a.waiting.toFixed(2);
  el.avgTurnaround.textContent = a.turnaround.toFixed(2);
  el.avgResponse.textContent = a.response.toFixed(2);
  el.utilisation.textContent = span > 0 ? `${Math.round(((span - a.idleTime) / span) * 100)}%` : '–';
}

function renderLog(result) {
  if (!result.log.length) {
    el.log.innerHTML = '<li class="log-empty">This policy produced no events.</li>';
    return;
  }
  el.log.innerHTML = result.log.map((e) => `
    <li class="log-ev-${escapeHtml(e.event)}">
      <span class="log-t">${e.time}</span>
      <span class="log-d">${escapeHtml(e.detail)}</span>
    </li>`).join('');
}

// ============== Simulation ==============

function runSimulation(animate = true) {
  const data = validate();
  if (!data) return;

  const algo = selectedAlgorithm();
  const result = runScheduler(data, algo, parseInt(el.quantum.value, 10));
  if (!result.gantt.length) return;

  hasRun = true;
  renderTimeline(result, data, algo, animate);
  renderResults(result, data);
  renderLog(result);

  if (!el.compareTable.hidden) runComparison();
}

el.run.addEventListener('click', () => {
  runSimulation(true);
  if (window.matchMedia('(max-width: 1000px)').matches) {
    $('gantt-chart').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ============== Comparison ==============

function runComparison() {
  const picked = Array.from(el.compareControls.querySelectorAll('input:checked')).map((c) => c.value);
  if (picked.length < 2) {
    el.compareHint.textContent = 'Pick at least two policies to compare.';
    el.compareTable.hidden = true;
    return;
  }
  const data = validate();
  if (!data) return;

  el.compareHint.textContent = '';
  const quantum = parseInt(el.quantum.value, 10);
  const rows = picked.map((key) => ({ key, ...runScheduler(data, key, quantum).averages }));
  const metrics = ['waiting', 'turnaround', 'response'];
  const max = Object.fromEntries(metrics.map((m) => [m, Math.max(...rows.map((r) => r[m]), 0.0001)]));
  const min = Object.fromEntries(metrics.map((m) => [m, Math.min(...rows.map((r) => r[m]))]));
  const current = selectedAlgorithm();

  el.compareBody.innerHTML = rows.map((r) => `
    <tr class="${r.key === current ? 'current' : ''}">
      <td title="${ALGORITHMS[r.key].full}">${ALGORITHMS[r.key].name}</td>
      ${metrics.map((m) => {
        const best = Math.abs(r[m] - min[m]) < 1e-9;
        return `<td class="${best ? 'best' : ''}">
          <div class="bar-cell">
            <div class="bar"><i style="--w:${(r[m] / max[m]) * 100}%"></i></div>
            <span class="bar-val"${best ? ' aria-label="' + r[m].toFixed(2) + ', lowest"' : ''}>${r[m].toFixed(2)}</span>
          </div>
        </td>`;
      }).join('')}
    </tr>`).join('');
  el.compareTable.hidden = false;
}

el.compareBtn.addEventListener('click', runComparison);

// ============== Init ==============

function init() {
  setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  resetTable(SAMPLE_DATA);
  updateColumnRelevance();
  validate();
}

init();
