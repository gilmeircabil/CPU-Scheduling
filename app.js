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
  presetBar: $('preset-bar'),
  presetNote: $('preset-note'),
  clearAll: $('clear-all'),
  processTable: $('process-table'),
  processBody: $('process-body'),
  columnHint: $('column-hint'),
  errors: $('validation-errors'),
  quantum: $('quantum'),
  quantumField: $('quantum-field'),
  run: $('run-simulation'),
  ganttChart: $('gantt-chart'),
  gantt: $('gantt'),
  ganttKey: $('gantt-key'),
  inspector: $('timeline-inspector'),
  stepPrev: $('step-prev'),
  stepNext: $('step-next'),
  inspectorTime: $('inspector-time'),
  inspectorCpu: $('inspector-cpu'),
  inspectorQueue: $('inspector-queue'),
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

const PRESETS = {
  default: {
    note: 'Balanced workload with staggered arrivals, mixed burst lengths, priorities, and queues.',
    quantum: 4,
    data: [
      { pid: 'P1', arrival: 0, burst: 5, priority: 2, queue: 1 },
      { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 2 },
      { pid: 'P3', arrival: 2, burst: 8, priority: 3, queue: 3 },
      { pid: 'P4', arrival: 4, burst: 2, priority: 2, queue: 1 }
    ]
  },
  convoy: {
    note: 'Convoy effect: P1’s long burst at t = 0 stalls three short jobs under FCFS — compare with SJF or SRTF.',
    quantum: 4,
    data: [
      { pid: 'P1', arrival: 0, burst: 14, priority: 3, queue: 2 },
      { pid: 'P2', arrival: 1, burst: 2, priority: 1, queue: 1 },
      { pid: 'P3', arrival: 2, burst: 1, priority: 1, queue: 1 },
      { pid: 'P4', arrival: 3, burst: 2, priority: 2, queue: 1 }
    ]
  },
  starvation: {
    note: 'Starvation: a stream of short, high-priority arrivals repeatedly preempts P1 under SRTF and Priority (P).',
    quantum: 3,
    data: [
      { pid: 'P1', arrival: 0, burst: 10, priority: 3, queue: 2 },
      { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 1 },
      { pid: 'P3', arrival: 3, burst: 3, priority: 1, queue: 1 },
      { pid: 'P4', arrival: 5, burst: 3, priority: 1, queue: 1 },
      { pid: 'P5', arrival: 7, burst: 2, priority: 1, queue: 1 }
    ]
  },
  quantum: {
    note: 'Quantum sensitivity: with quantum = 2, Round Robin gives every process a fast first response.',
    quantum: 2,
    data: [
      { pid: 'P1', arrival: 0, burst: 6, priority: 2, queue: 1 },
      { pid: 'P2', arrival: 1, burst: 4, priority: 1, queue: 1 },
      { pid: 'P3', arrival: 2, burst: 9, priority: 3, queue: 2 },
      { pid: 'P4', arrival: 3, burst: 3, priority: 2, queue: 1 }
    ]
  },
  mlfq: {
    note: 'MLFQ demotion: P1 uses full quanta and drops from level 1 → 2 → 3 while short arrivals stay responsive.',
    quantum: 3,
    data: [
      { pid: 'P1', arrival: 0, burst: 14, priority: 2, queue: 1 },
      { pid: 'P2', arrival: 2, burst: 2, priority: 1, queue: 1 },
      { pid: 'P3', arrival: 6, burst: 3, priority: 1, queue: 1 }
    ]
  }
};

// State
let pidCounter = 0;
let hasRun = false;
let lastResult = null;
let lastData = null;
let totalTime = 0;
let inspectedTime = 0;

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

function setActivePreset(presetKey) {
  el.presetBar.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === presetKey);
  });
  el.presetNote.textContent = presetKey && PRESETS[presetKey] ? PRESETS[presetKey].note : '';
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

function loadPreset(presetKey) {
  const preset = PRESETS[presetKey];
  if (!preset) return;
  if (preset.quantum) el.quantum.value = String(preset.quantum);
  resetTable(preset.data);
  setActivePreset(presetKey);
  runSimulation(true);
}

el.presetBar.addEventListener('click', (e) => {
  const btn = e.target.closest('.preset-btn');
  if (!btn) return;
  loadPreset(btn.dataset.preset);
});

el.processBody.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-btn');
  if (!btn) return;
  const row = btn.closest('tr');
  const next = row.nextElementSibling || row.previousElementSibling;
  row.remove();
  paintRowColours();
  setActivePreset(null);
  // Keep keyboard focus in the table after removing a row
  (next?.querySelector('.remove-btn') || el.addRow).focus();
  onWorkloadChanged();
});

el.addRow.addEventListener('click', () => {
  const row = addProcessRow();
  setActivePreset(null);
  row.querySelector('.arrival-input').focus();
  onWorkloadChanged();
});

el.clearAll.addEventListener('click', () => {
  resetTable([]);
  addProcessRow();
  setActivePreset(null);
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

el.processBody.addEventListener('input', () => {
  setActivePreset(null);
  onWorkloadChanged();
});
el.quantum.addEventListener('input', onWorkloadChanged);

// ============== Rendering ==============

function clearOutputs() {
  lastResult = null;
  lastData = null;
  totalTime = 0;
  inspectedTime = 0;
  el.gantt.innerHTML = '<div class="empty"><p>Add processes and run the simulation to draw the timeline.</p></div>';
  el.inspector.hidden = true;
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
  totalTime = total;
  const step = total <= 30 ? 1 : total <= 60 ? 2 : total <= 150 ? 5 : 10;

  const seg = (g, cls = '') => {
    const label = g.isIdle ? 'idle' : escapeHtml(g.pid);
    const style = `--s:${g.start};--e:${g.end};${g.isIdle ? '' : `--c:${colours.get(g.pid)}`}`;
    const title = g.isIdle ? `Idle ${g.start}–${g.end}` : `${g.pid} runs ${g.start}–${g.end}`;
    return `<div class="seg ${g.isIdle ? 'idle' : ''} ${cls}" style="${style}" title="${title}">${label}</div>`;
  };

  // Vertical time cursor line
  let html = `<div class="cursor-line" id="cursor-line"><span class="cursor-badge" id="cursor-badge">t = 0</span></div>`;

  // CPU lane
  html += `<div class="lane-label cpu">CPU</div><div class="lane cpu-lane" data-lane="cpu">${result.gantt.map((g) => seg(g)).join('')}</div>`;

  // One lane per process: arrival marker, waiting band, run segments
  data.forEach((p) => {
    const runs = result.gantt.filter((g) => !g.isIdle && g.pid === p.pid);
    const done = result.processes.find((r) => r.pid === p.pid)?.completion ?? p.arrival;
    const c = colours.get(p.pid);
    html += `<div class="lane-label">${escapeHtml(p.pid)}</div>
      <div class="lane" data-lane="${escapeHtml(p.pid)}" style="--c:${c}">
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

  el.gantt.innerHTML = `<div class="gantt-grid${animate ? ' animate' : ''}" id="gantt-grid" style="--units:${total};--cursor-t:0" role="img" aria-label="${escapeHtml(timelineDescription(result))}">${html}</div>`;
  el.inspector.hidden = false;
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

function setInspectedTime(t, { scrollLog = false } = {}) {
  if (!lastResult || !lastData) return;
  const clamped = Math.max(0, Math.min(totalTime, Math.round(t)));
  inspectedTime = clamped;

  const grid = $('gantt-grid');
  const badge = $('cursor-badge');
  if (grid) grid.style.setProperty('--cursor-t', String(clamped));
  if (badge) badge.textContent = `t = ${clamped}`;

  el.inspectorTime.textContent = `t = ${clamped}`;
  el.stepPrev.disabled = clamped <= 0;
  el.stepNext.disabled = clamped >= totalTime;

  const colours = colourMap();
  const remMap = new Map();
  const burstMap = new Map();

  lastData.forEach((p) => {
    const executed = lastResult.gantt
      .filter((g) => !g.isIdle && g.pid === p.pid)
      .reduce((sum, g) => sum + Math.max(0, Math.min(clamped, g.end) - g.start), 0);
    remMap.set(p.pid, Math.max(0, p.burst - executed));
    burstMap.set(p.pid, p.burst);
  });

  const activeSeg = clamped < totalTime
    ? lastResult.gantt.find((g) => g.start <= clamped && clamped < g.end)
    : null;
  const runningPid = activeSeg && !activeSeg.isIdle ? activeSeg.pid : null;

  if (clamped >= totalTime) {
    el.inspectorCpu.innerHTML = `<span class="inspector-meta">All processes finished at t = ${totalTime}</span>`;
  } else if (!activeSeg || activeSeg.isIdle) {
    el.inspectorCpu.innerHTML = `<span class="inspector-meta">Idle (${activeSeg ? `${activeSeg.start}–${activeSeg.end}` : `t = ${clamped}`})</span>`;
  } else {
    const c = colours.get(runningPid);
    const rem = remMap.get(runningPid);
    const burst = burstMap.get(runningPid);
    el.inspectorCpu.innerHTML = `<span class="pid-tag" style="--c:${c}">${escapeHtml(runningPid)}</span><span class="inspector-meta">running (${activeSeg.start}–${activeSeg.end}, rem ${rem} of ${burst})</span>`;
  }

  const waitingProcs = clamped < totalTime
    ? lastData.filter((p) => p.arrival <= clamped && remMap.get(p.pid) > 0 && p.pid !== runningPid)
    : [];

  if (!waitingProcs.length) {
    el.inspectorQueue.innerHTML = `<span class="inspector-meta">Empty</span>`;
  } else {
    el.inspectorQueue.innerHTML = `<span class="queue-chips">${waitingProcs
      .map((p) => `<span class="q-chip" style="--c:${colours.get(p.pid)}">${escapeHtml(p.pid)} <small>rem ${remMap.get(p.pid)}</small></span>`)
      .join('')}</span>`;
  }

  // Highlight active process in Per-process results
  el.resultsBody.querySelectorAll('tr[data-pid]').forEach((row) => {
    row.classList.toggle('active-proc', row.dataset.pid === runningPid);
  });

  // Highlight matching events in Event log
  let firstMatch = null;
  el.log.querySelectorAll('li[data-time]').forEach((li) => {
    const match = Number(li.dataset.time) === clamped;
    li.classList.toggle('active-time', match);
    if (match && !firstMatch) firstMatch = li;
  });
  if (scrollLog && firstMatch) {
    firstMatch.scrollIntoView({ block: 'nearest' });
  }
}

el.gantt.addEventListener('pointermove', (e) => {
  if (!lastResult) return;
  const lane = e.target.closest('.lane');
  if (!lane) return;
  const rect = lane.getBoundingClientRect();
  if (rect.width <= 0) return;
  const ratio = (e.clientX - rect.left) / rect.width;
  setInspectedTime(ratio * totalTime, { scrollLog: true });
});

el.stepPrev.addEventListener('click', () => {
  setInspectedTime(inspectedTime - 1, { scrollLog: true });
});

el.stepNext.addEventListener('click', () => {
  setInspectedTime(inspectedTime + 1, { scrollLog: true });
});

el.ganttChart.addEventListener('keydown', (e) => {
  if (!lastResult) return;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    setInspectedTime(inspectedTime - 1, { scrollLog: true });
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    setInspectedTime(inspectedTime + 1, { scrollLog: true });
  }
});

el.log.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-time]');
  if (!li) return;
  setInspectedTime(Number(li.dataset.time), { scrollLog: false });
});

function renderResults(result, data) {
  const colours = colourMap();
  const order = new Map(data.map((p, i) => [p.pid, i]));
  const rows = [...result.processes].sort((a, b) => order.get(a.pid) - order.get(b.pid));

  el.resultsBody.innerHTML = rows.map((p) => `
    <tr data-pid="${escapeHtml(p.pid)}">
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
    <li class="log-ev-${escapeHtml(e.event)}" data-time="${e.time}" title="Inspect t = ${e.time}">
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
  lastResult = result;
  lastData = data;
  renderTimeline(result, data, algo, animate);
  renderResults(result, data);
  renderLog(result);
  setInspectedTime(Math.min(inspectedTime, totalTime));
  runComparison();
}

el.run.addEventListener('click', () => {
  runSimulation(true);
  if (window.matchMedia('(max-width: 1000px)').matches) {
    $('gantt-chart').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ============== Comparison ==============

function updateCompareBtnLabel() {
  const boxes = Array.from(el.compareControls.querySelectorAll('input[type="checkbox"]'));
  const allChecked = boxes.every((c) => c.checked);
  el.compareBtn.textContent = allChecked ? 'Default selection' : 'Select all';
}

function runComparison() {
  updateCompareBtnLabel();
  const picked = Array.from(el.compareControls.querySelectorAll('input:checked')).map((c) => c.value);
  if (picked.length < 2) {
    el.compareHint.textContent = 'Pick at least two policies to compare.';
    el.compareTable.hidden = true;
    return;
  }
  const data = validate();
  if (!data) return;

  el.compareHint.textContent = '';
  const colours = colourMap();
  const quantum = parseInt(el.quantum.value, 10);
  const runs = picked.map((key) => {
    const res = runScheduler(data, key, quantum);
    const end = Math.max(...res.gantt.map((g) => g.end), 1);
    return { key, gantt: res.gantt, end, ...res.averages };
  });
  const maxEnd = Math.max(...runs.map((r) => r.end), 1);
  const metrics = ['waiting', 'turnaround', 'response'];
  const max = Object.fromEntries(metrics.map((m) => [m, Math.max(...runs.map((r) => r[m]), 0.0001)]));
  const min = Object.fromEntries(metrics.map((m) => [m, Math.min(...runs.map((r) => r[m]))]));
  const current = selectedAlgorithm();

  el.compareBody.innerHTML = runs.map((r) => {
    const miniSegs = r.gantt.map((g) => {
      const style = `--s:${g.start};--e:${g.end};${g.isIdle ? '' : `--c:${colours.get(g.pid)}`}`;
      const title = g.isIdle ? `Idle ${g.start}–${g.end}` : `${g.pid}: ${g.start}–${g.end}`;
      return `<span class="mini-seg${g.isIdle ? ' idle' : ''}" style="${style}" title="${title}"></span>`;
    }).join('');

    return `
      <tr class="${r.key === current ? 'current' : ''}" data-algo="${r.key}" tabindex="0" title="Switch timeline to ${ALGORITHMS[r.key].full}">
        <td>${ALGORITHMS[r.key].name}</td>
        <td class="col-schedule">
          <div class="mini-gantt" style="--units:${maxEnd}">${miniSegs}</div>
        </td>
        ${metrics.map((m) => {
          const best = Math.abs(r[m] - min[m]) < 1e-9;
          return `<td class="${best ? 'best' : ''}">
            <div class="bar-cell">
              <div class="bar"><i style="--w:${(r[m] / max[m]) * 100}%"></i></div>
              <span class="bar-val"${best ? ' aria-label="' + r[m].toFixed(2) + ', lowest"' : ''}>${r[m].toFixed(2)}</span>
            </div>
          </td>`;
        }).join('')}
      </tr>`;
  }).join('');
  el.compareTable.hidden = false;
}

el.compareControls.addEventListener('change', (e) => {
  if (e.target.matches('input[type="checkbox"]')) {
    runComparison();
  }
});

el.compareBtn.addEventListener('click', () => {
  const boxes = Array.from(el.compareControls.querySelectorAll('input[type="checkbox"]'));
  const allChecked = boxes.every((c) => c.checked);
  const defaults = new Set(['fcfs', 'sjf', 'srtf', 'round-robin']);
  boxes.forEach((c) => {
    c.checked = allChecked ? defaults.has(c.value) : true;
  });
  runComparison();
});

function selectPolicyFromComparison(algoKey) {
  const radio = document.querySelector(`input[name="algorithm"][value="${algoKey}"]`);
  if (!radio) return;
  radio.checked = true;
  updateColumnRelevance();
  runSimulation(true);
}

el.compareBody.addEventListener('click', (e) => {
  const row = e.target.closest('tr[data-algo]');
  if (!row) return;
  selectPolicyFromComparison(row.dataset.algo);
});

el.compareBody.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const row = e.target.closest('tr[data-algo]');
  if (!row) return;
  e.preventDefault();
  selectPolicyFromComparison(row.dataset.algo);
});

// ============== Init ==============

function init() {
  setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  loadPreset('default');
}

init();
