/**
 * CPU Scheduling Simulator - UI Logic
 * Handles DOM manipulation, event handling, and rendering.
 * Supports 4 core algorithms: FCFS, SJF, Round Robin, Multilevel Queue.
 * Written in simple, beginner-friendly JavaScript.
 */

import { validateProcesses, runScheduler } from './scheduler.js';

// Helper function to get an element by ID
function getElement(id) {
  return document.getElementById(id);
}

const el = {
  themeToggle: getElement('theme-toggle'),
  addRow: getElement('add-row'),
  loadSample: getElement('load-sample'),
  clearAll: getElement('clear-all'),
  processTable: getElement('process-table'),
  processBody: getElement('process-body'),
  columnHint: getElement('column-hint'),
  errors: getElement('validation-errors'),
  quantum: getElement('quantum'),
  quantumField: getElement('quantum-field'),
  run: getElement('run-simulation'),
  ganttChart: getElement('gantt-chart'),
  gantt: getElement('gantt'),
  ganttKey: getElement('gantt-key'),
  timelineSub: getElement('timeline-sub'),
  resultsBody: getElement('results-body'),
  avgWaiting: getElement('avg-waiting'),
  avgTurnaround: getElement('avg-turnaround'),
  avgResponse: getElement('avg-response'),
  utilisation: getElement('utilisation'),
  compareBtn: getElement('compare-selected'),
  compareControls: getElement('comparison-controls'),
  compareHint: getElement('compare-hint'),
  compareTable: getElement('compare-table'),
  compareBody: getElement('comparison-body')
};

const ALGORITHMS = {
  'fcfs': { name: 'FCFS', full: 'First come, first served' },
  'sjf': { name: 'SJF', full: 'Shortest job first' },
  'round-robin': { name: 'RR', full: 'Round robin', usesQuantum: true },
  'multilevel-queue': { name: 'MLQ', full: 'Multilevel queue', usesQuantum: true, usesQueue: true }
};

const PROCESS_COLOURS = 8;

const SAMPLE_DATA = [
  { pid: 'P1', arrival: 0, burst: 5, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, queue: 2 },
  { pid: 'P3', arrival: 2, burst: 8, queue: 3 },
  { pid: 'P4', arrival: 4, burst: 2, queue: 1 }
];

// Global State
let pidCounter = 0;
let rowOrderCounter = 0;
let hasRun = false;

// Per-queue scheduling policies for MLQ (queue number → algorithm key).
// Queue 1 defaults to round robin; queues 2 & 3 default to FCFS.
let queueConfig = { 1: 'round-robin', 2: 'fcfs', 3: 'fcfs' };

// ============== Theme ==============

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const ariaLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  el.themeToggle.setAttribute('aria-label', ariaLabel);
}

el.themeToggle.addEventListener('click', function () {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  if (current === 'dark') {
    setTheme('light');
  } else {
    setTheme('dark');
  }
});

// ============== Helpers ==============

function formatNumber(n) {
  if (Number.isInteger(n)) {
    return String(n);
  }
  return n.toFixed(2);
}

function escapeHtml(text) {
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSelectedAlgorithm() {
  const radio = document.querySelector('input[name="algorithm"]:checked');
  return radio.value;
}

/** Assigns CSS color variable to each process PID by row position */
function getProcessColours() {
  const colours = {};
  const rows = el.processBody.querySelectorAll('tr[data-pid]');
  for (let i = 0; i < rows.length; i++) {
    const pid = rows[i].dataset.pid;
    const colourNumber = (i % PROCESS_COLOURS) + 1;
    colours[pid] = 'var(--p' + colourNumber + ')';
  }
  return colours;
}

// ============== Workload Table ==============

function addProcessRow(p) {
  let pid = '';
  if (p && p.pid) {
    pid = p.pid;
  } else {
    pidCounter = pidCounter + 1;
    pid = 'P' + pidCounter;
  }

  let arrivalVal = 0;
  let burstVal = 4;
  let queueVal = 1;

  if (p) {
    if (p.arrival !== undefined && p.arrival !== null) arrivalVal = p.arrival;
    if (p.burst !== undefined && p.burst !== null) burstVal = p.burst;
    if (p.queue !== undefined && p.queue !== null) queueVal = p.queue;
  }

  const row = document.createElement('tr');
  row.dataset.pid = pid;
  // Stable position used to restore the flat list order after MLQ grouping
  rowOrderCounter = rowOrderCounter + 1;
  row.dataset.order = String(rowOrderCounter);

  const q1Selected = (queueVal === 1) ? ' selected' : '';
  const q2Selected = (queueVal === 2) ? ' selected' : '';
  const q3Selected = (queueVal === 3) ? ' selected' : '';

  row.innerHTML =
    '<td><span class="pid-tag">' + escapeHtml(pid) + '</span></td>' +
    '<td><input type="number" class="arrival-input" min="0" inputmode="numeric" value="' + arrivalVal + '" aria-label="' + pid + ' arrival time"></td>' +
    '<td><input type="number" class="burst-input" min="1" inputmode="numeric" value="' + burstVal + '" aria-label="' + pid + ' burst time"></td>' +
    '<td data-cell="queue">' +
      '<select class="queue-input" aria-label="' + pid + ' queue">' +
        '<option value="1"' + q1Selected + '>1</option>' +
        '<option value="2"' + q2Selected + '>2</option>' +
        '<option value="3"' + q3Selected + '>3</option>' +
      '</select>' +
      '<span class="queue-static" aria-hidden="true">' + queueVal + '</span>' +
    '</td>' +
    '<td><button type="button" class="remove-btn" aria-label="Remove ' + pid + '" title="Remove ' + pid + '">&times;</button></td>';

  el.processBody.appendChild(row);
  paintRowColours();
  updateColumnRelevance();
  return row;
}

function paintRowColours() {
  const colours = getProcessColours();
  const rows = el.processBody.querySelectorAll('tr');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const pid = row.dataset.pid;
    const tag = row.querySelector('.pid-tag');
    if (tag && colours[pid]) {
      tag.style.setProperty('--c', colours[pid]);
    }
  }
}

// ============== MLQ Queue Grouping ==============

// Algorithms each queue can run inside the MLQ view
const QUEUE_ALGO_OPTIONS = [
  { value: 'round-robin', label: 'Round robin' },
  { value: 'sjf', label: 'Shortest job first' },
  { value: 'fcfs', label: 'First come, first served' }
];

/**
 * MLQ view: processes are organised into their queues instead of a flat
 * process list. Each queue gets its own section header with an algorithm
 * dropdown (round robin / SJF / FCFS) and add button, and the queue is
 * owned by the section (no per-row dropdown).
 * Every other policy: flat process list in the original row order.
 */
function applyQueueGrouping() {
  const grouped = getSelectedAlgorithm() === 'multilevel-queue';

  // Remove existing section headers
  const headers = el.processBody.querySelectorAll('.queue-header-row');
  for (let i = 0; i < headers.length; i++) {
    headers[i].remove();
  }

  const rows = [];
  const allRows = el.processBody.querySelectorAll('tr[data-pid]');
  for (let i = 0; i < allRows.length; i++) {
    rows.push(allRows[i]);
  }

  if (!grouped) {
    // Flat view: restore the original row order
    rows.sort(function (a, b) {
      return Number(a.dataset.order) - Number(b.dataset.order);
    });
    for (let i = 0; i < rows.length; i++) {
      el.processBody.appendChild(rows[i]);
    }
  } else {
    // Keep the static queue tags in sync with the select values
    const rowQueues = [];
    for (let i = 0; i < rows.length; i++) {
      let rowQueue = parseInt(rows[i].querySelector('.queue-input').value, 10);
      if (isNaN(rowQueue)) rowQueue = 1;
      rowQueues.push(rowQueue);
      const staticTag = rows[i].querySelector('.queue-static');
      if (staticTag) staticTag.textContent = String(rowQueue);
    }

    // Grouped view: one section per queue, in priority order
    for (let q = 1; q <= 3; q++) {
      // Algorithm dropdown for this queue (round robin / SJF / FCFS)
      let optionsHtml = '';
      for (let k = 0; k < QUEUE_ALGO_OPTIONS.length; k++) {
        const opt = QUEUE_ALGO_OPTIONS[k];
        const isSel = (queueConfig[q] === opt.value) ? ' selected' : '';
        optionsHtml += '<option value="' + opt.value + '"' + isSel + '>' + opt.label + '</option>';
      }

      const header = document.createElement('tr');
      header.className = 'queue-header-row';
      header.dataset.queue = String(q);
      header.innerHTML =
        '<td colspan="5">' +
          '<div class="queue-head">' +
            '<span class="queue-head-label">Queue ' + q + '</span>' +
            '<select class="queue-algo" data-queue="' + q + '" aria-label="Queue ' + q + ' scheduling algorithm">' + optionsHtml + '</select>' +
            '<button type="button" class="btn btn-quiet btn-add-q" data-queue="' + q + '" aria-label="Add process to queue ' + q + '">+ Add process</button>' +
          '</div>' +
        '</td>';
      el.processBody.appendChild(header);

      for (let i = 0; i < rows.length; i++) {
        if (rowQueues[i] === q) {
          el.processBody.appendChild(rows[i]);
        }
      }
    }
  }

  el.addRow.hidden = grouped;
  el.processTable.classList.toggle('queue-sections', grouped);
  paintRowColours();
}

/** Next/previous process row, skipping MLQ section headers */
function getAdjacentProcessRow(row) {
  let next = row.nextElementSibling;
  while (next && !next.hasAttribute('data-pid')) {
    next = next.nextElementSibling;
  }
  if (next) return next;
  let prev = row.previousElementSibling;
  while (prev && !prev.hasAttribute('data-pid')) {
    prev = prev.previousElementSibling;
  }
  return prev;
}

/** Focus the global add button, or the first queue add button when grouped */
function focusAddFallback() {
  if (el.addRow.hidden) {
    const qBtn = el.processBody.querySelector('.btn-add-q');
    if (qBtn) {
      qBtn.focus();
      return;
    }
  }
  el.addRow.focus();
}

/** Adds a new process directly into the given MLQ queue section */
function addProcessToQueue(queueNum) {
  let q = queueNum;
  if (isNaN(q) || q < 1 || q > 3) q = 1;
  const row = addProcessRow({ queue: q });
  row.querySelector('.arrival-input').focus();
  onWorkloadChanged();
}

function getProcessData() {
  const rows = el.processBody.querySelectorAll('tr[data-pid]');
  const list = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const pid = row.dataset.pid;
    const arrival = parseInt(row.querySelector('.arrival-input').value, 10);
    const burst = parseInt(row.querySelector('.burst-input').value, 10);
    const queue = parseInt(row.querySelector('.queue-input').value, 10);

    list.push({
      pid: pid,
      arrival: arrival,
      burst: burst,
      priority: 1,
      queue: queue
    });
  }
  return list;
}

function resetTable(data) {
  el.processBody.innerHTML = '';
  pidCounter = 0;
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    addProcessRow(p);
    const num = parseInt(p.pid.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > pidCounter) {
      pidCounter = num;
    }
  }
}

function loadSampleWorkload() {
  el.quantum.value = '4';
  resetTable(SAMPLE_DATA);
  runSimulation(true);
}

el.loadSample.addEventListener('click', function () {
  loadSampleWorkload();
});

el.processBody.addEventListener('click', function (e) {
  // Per-queue add button (MLQ grouped view)
  const addBtn = e.target.closest('.btn-add-q');
  if (addBtn) {
    addProcessToQueue(parseInt(addBtn.dataset.queue, 10));
    return;
  }

  const btn = e.target.closest('.remove-btn');
  if (!btn) return;
  const row = btn.closest('tr');
  const next = getAdjacentProcessRow(row);
  row.remove();
  paintRowColours();
  if (next && next.querySelector('.remove-btn')) {
    next.querySelector('.remove-btn').focus();
  } else {
    focusAddFallback();
  }
  onWorkloadChanged();
});

// Keep the MLQ per-queue policy selection in sync with the scheduler config.
// Registered before the generic workload input listener so a policy change is
// applied to queueConfig before the simulation re-runs from the same event.
function syncQueueAlgoSelection(e) {
  const sel = e.target.closest('.queue-algo');
  if (!sel) return;
  const q = parseInt(sel.dataset.queue, 10);
  if (q >= 1 && q <= 3) {
    queueConfig[q] = sel.value;
  }
}
el.processBody.addEventListener('input', syncQueueAlgoSelection);
el.processBody.addEventListener('change', syncQueueAlgoSelection);

el.addRow.addEventListener('click', function () {
  const row = addProcessRow();
  row.querySelector('.arrival-input').focus();
  onWorkloadChanged();
});

el.clearAll.addEventListener('click', function () {
  resetTable([]);
  addProcessRow();
  hasRun = false;
  clearOutputs();
  validate();
});

// ============== Policy-aware Form ==============

function updateColumnRelevance() {
  const algoKey = getSelectedAlgorithm();
  const algo = ALGORITHMS[algoKey];

  function setColumnUsed(colName, isUsed) {
    const cells = el.processTable.querySelectorAll('[data-col="' + colName + '"], [data-cell="' + colName + '"]');
    for (let i = 0; i < cells.length; i++) {
      if (isUsed) {
        cells[i].classList.remove('unused');
      } else {
        cells[i].classList.add('unused');
      }
    }
  }

  setColumnUsed('queue', Boolean(algo.usesQueue));

  if (!algo.usesQueue) {
    el.columnHint.textContent = algo.full + ' ignores queue.';
  } else if (algoKey === 'multilevel-queue') {
    el.columnHint.textContent = 'Processes run as queues and each queue runs its own algorithm — a higher queue always preempts the lower ones. The time quantum applies to queues set to round robin. Switch to another policy to move a process between queues.';
  } else {
    el.columnHint.textContent = '';
  }

  if (algo.usesQuantum) {
    el.quantumField.classList.remove('off');
    el.quantum.disabled = false;
    el.quantumField.title = '';
  } else {
    el.quantumField.classList.add('off');
    el.quantum.disabled = true;
    el.quantumField.title = 'Only used by round robin and MLQ';
  }

  // Switch between the flat process list and grouped queue sections (MLQ)
  applyQueueGrouping();
}

const algoRadios = document.querySelectorAll('input[name="algorithm"]');
for (let i = 0; i < algoRadios.length; i++) {
  algoRadios[i].addEventListener('change', function () {
    updateColumnRelevance();
    if (hasRun) {
      runSimulation(false);
    }
  });
}

// ============== Validation ==============

function validate() {
  const data = getProcessData();
  const quantumVal = parseInt(el.quantum.value, 10);
  const result = validateProcesses(data, { quantum: quantumVal });
  const errors = result.errors;

  // Clear previous error styles
  const allInputs = el.processBody.querySelectorAll('input');
  for (let i = 0; i < allInputs.length; i++) {
    allInputs[i].removeAttribute('aria-invalid');
  }
  el.quantum.removeAttribute('aria-invalid');

  const rows = el.processBody.querySelectorAll('tr[data-pid]');

  for (let i = 0; i < errors.length; i++) {
    const msg = errors[i];
    if (msg.indexOf('Time quantum') === 0) {
      el.quantum.setAttribute('aria-invalid', 'true');
    } else {
      const match = msg.match(/^Row (\d+): (\w+)/);
      if (match) {
        const rowIdx = parseInt(match[1], 10) - 1;
        const fieldName = match[2];
        const row = rows[rowIdx];
        if (row) {
          let fieldClass = '';
          if (fieldName === 'Arrival') fieldClass = '.arrival-input';
          if (fieldName === 'Burst') fieldClass = '.burst-input';
          if (fieldClass) {
            const inputEl = row.querySelector(fieldClass);
            if (inputEl) inputEl.setAttribute('aria-invalid', 'true');
          }
        }
      }
    }
  }

  // Display errors using friendly process IDs
  const prettyErrors = [];
  for (let i = 0; i < errors.length; i++) {
    const msg = errors[i];
    const match = msg.match(/^Row (\d+):(.*)/);
    if (match) {
      const rowIdx = parseInt(match[1], 10) - 1;
      let label = 'Row ' + match[1];
      if (rows[rowIdx] && rows[rowIdx].dataset.pid) {
        label = rows[rowIdx].dataset.pid;
      }
      prettyErrors.push(label + ':' + match[2]);
    } else {
      prettyErrors.push(msg);
    }
  }

  if (data.length === 0) {
    prettyErrors.push('Add at least one process to run the simulation.');
  }

  let errorItemsHtml = '';
  for (let i = 0; i < prettyErrors.length; i++) {
    errorItemsHtml += '<li>' + escapeHtml(prettyErrors[i]) + '</li>';
  }
  el.errors.innerHTML = errorItemsHtml;

  const isValid = result.valid && data.length > 0;
  el.run.disabled = !isValid;

  if (isValid) {
    return data;
  }
  return null;
}

function onWorkloadChanged() {
  const data = validate();
  if (data && hasRun) {
    runSimulation(false);
  }
}

el.processBody.addEventListener('input', onWorkloadChanged);
el.quantum.addEventListener('input', onWorkloadChanged);

// ============== Rendering ==============

function clearOutputs() {
  el.gantt.innerHTML = '<div class="empty"><p>Add processes and run the simulation to draw the timeline.</p></div>';
  el.ganttKey.hidden = true;
  el.timelineSub.textContent = 'No run yet';
  el.resultsBody.innerHTML = '<tr><td colspan="7" class="empty-cell">Results appear here after a run.</td></tr>';
  el.avgWaiting.textContent = '–';
  el.avgTurnaround.textContent = '–';
  el.avgResponse.textContent = '–';
  el.utilisation.textContent = '–';
  if (el.compareTable) {
    el.compareTable.hidden = true;
  }
  if (el.compareHint) {
    el.compareHint.textContent = '';
  }
}

function renderTimeline(result, data, algoKey, animate) {
  const colours = getProcessColours();

  let total = 0;
  for (let i = 0; i < result.gantt.length; i++) {
    if (result.gantt[i].end > total) {
      total = result.gantt[i].end;
    }
  }

  let step = 10;
  if (total <= 30) {
    step = 1;
  } else if (total <= 60) {
    step = 2;
  } else if (total <= 150) {
    step = 5;
  }

  function makeSegmentHtml(g) {
    let label = '';
    let style = '--s:' + g.start + ';--e:' + g.end + ';';
    let title = '';
    if (g.isIdle) {
      label = 'idle';
      title = 'Idle ' + g.start + '–' + g.end;
    } else {
      label = escapeHtml(g.pid);
      style += '--c:' + (colours[g.pid] || '') + ';';
      title = g.pid + ' runs ' + g.start + '–' + g.end;
    }
    const idleClass = g.isIdle ? ' idle' : '';
    return '<div class="seg' + idleClass + '" style="' + style + '" title="' + title + '">' + label + '</div>';
  }

  let html = '';

  // CPU lane
  let cpuSegments = '';
  for (let i = 0; i < result.gantt.length; i++) {
    cpuSegments += makeSegmentHtml(result.gantt[i]);
  }
  html += '<div class="lane-label cpu">CPU</div><div class="lane cpu-lane" data-lane="cpu">' + cpuSegments + '</div>';

  // Process lanes
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    let done = p.arrival;
    for (let j = 0; j < result.processes.length; j++) {
      if (result.processes[j].pid === p.pid) {
        done = result.processes[j].completion;
        break;
      }
    }
    const c = colours[p.pid] || '';

    let procSegments = '';
    for (let j = 0; j < result.gantt.length; j++) {
      const g = result.gantt[j];
      if (!g.isIdle && g.pid === p.pid) {
        procSegments += makeSegmentHtml(g);
      }
    }

    html += '<div class="lane-label">' + escapeHtml(p.pid) + '</div>' +
      '<div class="lane" data-lane="' + escapeHtml(p.pid) + '" style="--c:' + c + '">' +
        '<div class="wait" style="--s:' + p.arrival + ';--e:' + done + '" title="' + p.pid + ' in system ' + p.arrival + '–' + done + '"></div>' +
        '<div class="arrive" style="--s:' + p.arrival + '" title="' + p.pid + ' arrives at ' + p.arrival + '"></div>' +
        procSegments +
      '</div>';
  }

  // Time axis ticks
  let axisHtml = '';
  for (let t = 0; t <= total; t = t + step) {
    const edgeClass = (t === 0 || t === total) ? ' edge' : '';
    axisHtml += '<span class="tick' + edgeClass + '" style="--t:' + t + '">' + t + '</span>';
  }
  if (total % step !== 0) {
    axisHtml += '<span class="tick edge" style="--t:' + total + '">' + total + '</span>';
  }
  html += '<div></div><div class="axis">' + axisHtml + '</div>';

  const animateClass = animate ? ' animate' : '';
  el.gantt.innerHTML = '<div class="gantt-grid' + animateClass + '" id="gantt-grid" style="--units:' + total + '">' + html + '</div>';
  el.ganttKey.hidden = false;

  const algo = ALGORITHMS[algoKey];
  let qText = '';
  if (algo.usesQuantum) {
    qText = ', quantum ' + el.quantum.value;
  }
  el.timelineSub.textContent = algo.full + qText + '. Finishes at t = ' + total + '.';
}

function renderResults(result, data) {
  const colours = getProcessColours();

  let rowsHtml = '';
  for (let i = 0; i < data.length; i++) {
    const pInput = data[i];
    let p = null;
    for (let j = 0; j < result.processes.length; j++) {
      if (result.processes[j].pid === pInput.pid) {
        p = result.processes[j];
        break;
      }
    }
    if (!p) continue;

    rowsHtml += '<tr data-pid="' + escapeHtml(p.pid) + '">' +
      '<td><span class="pid-tag" style="--c:' + (colours[p.pid] || '') + '">' + escapeHtml(p.pid) + '</span></td>' +
      '<td>' + p.arrival + '</td>' +
      '<td>' + p.burst + '</td>' +
      '<td>' + p.completion + '</td>' +
      '<td>' + formatNumber(p.turnaround) + '</td>' +
      '<td>' + formatNumber(p.waiting) + '</td>' +
      '<td>' + formatNumber(p.response) + '</td>' +
    '</tr>';
  }
  el.resultsBody.innerHTML = rowsHtml;

  const a = result.averages;
  let totalTime = 0;
  let startTime = Infinity;
  for (let i = 0; i < result.gantt.length; i++) {
    if (result.gantt[i].end > totalTime) {
      totalTime = result.gantt[i].end;
    }
    if (result.gantt[i].start < startTime) {
      startTime = result.gantt[i].start;
    }
  }
  const span = totalTime - startTime;
  const busyTime = span - a.idleTime;

  el.avgWaiting.textContent = a.waiting.toFixed(2);
  el.avgTurnaround.textContent = a.turnaround.toFixed(2);
  el.avgResponse.textContent = a.response.toFixed(2);

  // CPU Utilisation percentage = (busyTime / totalTime) * 100
  if (span > 0) {
    const utilisationRate = (busyTime / span) * 100;
    el.utilisation.textContent = Math.round(utilisationRate) + '%';
  } else {
    el.utilisation.textContent = '–';
  }
}

// ============== Simulation ==============

function runSimulation(animate) {
  if (animate === undefined) animate = true;

  const data = validate();
  if (!data) return;

  const algo = getSelectedAlgorithm();
  const quantum = parseInt(el.quantum.value, 10);
  const result = runScheduler(data, algo, quantum, queueConfig);

  if (result.gantt.length === 0) return;

  hasRun = true;
  renderTimeline(result, data, algo, animate);
  renderResults(result, data);
  runComparison();
}

el.run.addEventListener('click', function () {
  runSimulation(true);
  if (window.matchMedia('(max-width: 1000px)').matches) {
    getElement('gantt-chart').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ============== Comparison ==============

function updateCompareBtnLabel() {
  if (!el.compareControls || !el.compareBtn) return;
  const boxes = el.compareControls.querySelectorAll('input[type="checkbox"]');
  let allChecked = true;
  for (let i = 0; i < boxes.length; i++) {
    if (!boxes[i].checked) {
      allChecked = false;
      break;
    }
  }
  if (allChecked) {
    el.compareBtn.textContent = 'Deselect all';
  } else {
    el.compareBtn.textContent = 'Select all';
  }
}

function selectPolicyFromComparison(algoKey) {
  const radio = document.querySelector('input[name="algorithm"][value="' + algoKey + '"]');
  if (!radio) return;
  radio.checked = true;
  updateColumnRelevance();
  runSimulation(true);
}

function runComparison() {
  if (!el.compareControls || !el.compareTable) return;
  updateCompareBtnLabel();

  const boxes = el.compareControls.querySelectorAll('input[type="checkbox"]');
  const picked = [];
  for (let i = 0; i < boxes.length; i++) {
    if (boxes[i].checked) {
      picked.push(boxes[i].value);
    }
  }

  if (picked.length < 2) {
    el.compareHint.textContent = 'Pick at least two policies to compare.';
    el.compareTable.hidden = true;
    return;
  }

  const data = validate();
  if (!data) return;

  el.compareHint.textContent = '';
  const colours = getProcessColours();
  const quantum = parseInt(el.quantum.value, 10);

  // Run each selected algorithm
  const runs = [];
  let maxEnd = 1;
  for (let i = 0; i < picked.length; i++) {
    const key = picked[i];
    const res = runScheduler(data, key, quantum, queueConfig);
    let runEnd = 1;
    for (let j = 0; j < res.gantt.length; j++) {
      if (res.gantt[j].end > runEnd) {
        runEnd = res.gantt[j].end;
      }
    }
    if (runEnd > maxEnd) {
      maxEnd = runEnd;
    }
    runs.push({
      key: key,
      gantt: res.gantt,
      end: runEnd,
      waiting: res.averages.waiting,
      turnaround: res.averages.turnaround,
      response: res.averages.response
    });
  }

  // Find max and min for the metrics to draw comparative bars
  let maxWaiting = 0.0001;
  let minWaiting = Infinity;
  let maxTurnaround = 0.0001;
  let minTurnaround = Infinity;
  let maxResponse = 0.0001;
  let minResponse = Infinity;

  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    if (r.waiting > maxWaiting) maxWaiting = r.waiting;
    if (r.waiting < minWaiting) minWaiting = r.waiting;

    if (r.turnaround > maxTurnaround) maxTurnaround = r.turnaround;
    if (r.turnaround < minTurnaround) minTurnaround = r.turnaround;

    if (r.response > maxResponse) maxResponse = r.response;
    if (r.response < minResponse) minResponse = r.response;
  }

  const currentAlgo = getSelectedAlgorithm();

  let rowsHtml = '';
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];

    // Mini Gantt bar segments
    let miniSegs = '';
    for (let j = 0; j < r.gantt.length; j++) {
      const g = r.gantt[j];
      let style = '--s:' + g.start + ';--e:' + g.end + ';';
      let title = '';
      if (g.isIdle) {
        title = 'Idle ' + g.start + '–' + g.end;
      } else {
        style += '--c:' + (colours[g.pid] || '') + ';';
        title = g.pid + ': ' + g.start + '–' + g.end;
      }
      const idleClass = g.isIdle ? ' idle' : '';
      miniSegs += '<span class="mini-seg' + idleClass + '" style="' + style + '" title="' + title + '"></span>';
    }

    const isCurrent = (r.key === currentAlgo) ? ' class="current"' : '';
    const algoInfo = ALGORITHMS[r.key];

    // Determine if this policy has the best (lowest) value
    const isBestWaiting = Math.abs(r.waiting - minWaiting) < 0.00001;
    const isBestTurnaround = Math.abs(r.turnaround - minTurnaround) < 0.00001;
    const isBestResponse = Math.abs(r.response - minResponse) < 0.00001;

    const waitPct = (r.waiting / maxWaiting) * 100;
    const turnPct = (r.turnaround / maxTurnaround) * 100;
    const respPct = (r.response / maxResponse) * 100;

    const waitBestClass = isBestWaiting ? 'best' : '';
    const turnBestClass = isBestTurnaround ? 'best' : '';
    const respBestClass = isBestResponse ? 'best' : '';

    rowsHtml +=
      '<tr' + isCurrent + ' data-algo="' + r.key + '" tabindex="0" title="Switch timeline to ' + algoInfo.full + '">' +
        '<td>' + algoInfo.name + '</td>' +
        '<td class="col-schedule">' +
          '<div class="mini-gantt" style="--units:' + maxEnd + '">' + miniSegs + '</div>' +
        '</td>' +
        '<td class="' + waitBestClass + '">' +
          '<div class="bar-cell">' +
            '<div class="bar"><i style="--w:' + waitPct + '%"></i></div>' +
            '<span class="bar-val">' + r.waiting.toFixed(2) + '</span>' +
          '</div>' +
        '</td>' +
        '<td class="' + turnBestClass + '">' +
          '<div class="bar-cell">' +
            '<div class="bar"><i style="--w:' + turnPct + '%"></i></div>' +
            '<span class="bar-val">' + r.turnaround.toFixed(2) + '</span>' +
          '</div>' +
        '</td>' +
        '<td class="' + respBestClass + '">' +
          '<div class="bar-cell">' +
            '<div class="bar"><i style="--w:' + respPct + '%"></i></div>' +
            '<span class="bar-val">' + r.response.toFixed(2) + '</span>' +
          '</div>' +
        '</td>' +
      '</tr>';
  }

  el.compareBody.innerHTML = rowsHtml;
  el.compareTable.hidden = false;
}

if (el.compareControls) {
  el.compareControls.addEventListener('change', function (e) {
    if (e.target.matches('input[type="checkbox"]')) {
      runComparison();
    }
  });
}

if (el.compareBtn) {
  el.compareBtn.addEventListener('click', function () {
    const boxes = el.compareControls.querySelectorAll('input[type="checkbox"]');
    let allChecked = true;
    for (let i = 0; i < boxes.length; i++) {
      if (!boxes[i].checked) {
        allChecked = false;
        break;
      }
    }
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].checked = !allChecked;
    }
    runComparison();
  });
}

if (el.compareBody) {
  el.compareBody.addEventListener('click', function (e) {
    const row = e.target.closest('tr[data-algo]');
    if (!row) return;
    selectPolicyFromComparison(row.dataset.algo);
  });

  el.compareBody.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = e.target.closest('tr[data-algo]');
    if (!row) return;
    e.preventDefault();
    selectPolicyFromComparison(row.dataset.algo);
  });
}

// ============== Init ==============

function init() {
  const savedTheme = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(savedTheme);
  loadSampleWorkload();
}

init();
