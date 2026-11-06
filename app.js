/**
 * CPU Scheduling Simulator - UI Logic
 * Handles DOM manipulation, event handling, and rendering
 * Imports: scheduler.js (algorithm functions)
 */

import { validateProcesses, runScheduler } from './scheduler.js';

// DOM Elements
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  addRowBtn: document.getElementById('add-row'),
  loadSampleBtn: document.getElementById('load-sample'),
  clearAllBtn: document.getElementById('clear-all'),
  quantumInput: document.getElementById('quantum'),
  processBody: document.getElementById('process-body'),
  validationErrors: document.getElementById('validation-errors'),
  algorithmSelect: document.getElementById('algorithm-select'),
  runSimulationBtn: document.getElementById('run-simulation'),
  compareSelectedBtn: document.getElementById('compare-selected'),
  compareCheckboxes: document.querySelectorAll('.comparison-controls input[type="checkbox"]'),
  comparisonSection: document.getElementById('comparison'),
  runSimBtn: document.getElementById('run-simulation'),
  comparisonBtn: document.getElementById('compare-selected'),
  ganttTimeline: document.getElementById('gantt-timeline'),
  timeLabels: document.getElementById('time-labels'),
  ganttLegend: document.getElementById('gantt-legend'),
  logContent: document.getElementById('log-content'),
  resultsBody: document.getElementById('results-body'),
  avgWaiting: document.getElementById('avg-waiting'),
  avgTurnaround: document.getElementById('avg-turnaround'),
  avgResponse: document.getElementById('avg-response'),
  idleInfo: document.getElementById('idle-info'),
  comparisonBody: document.getElementById('comparison-body')
};

// State
let processes = [];
let lastResult = null;
let comparisonResults = [];

// ============== Theme Management ==============

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = savedTheme || (systemDark ? 'dark' : 'light');
  setTheme(currentTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

elements.themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'light' ? 'dark' : 'light');
});

// ============== Process Table Management ==============

let rowCounter = 0;

function addProcessRow(process = null) {
  const pid = process ? process.pid : `P${++rowCounter}`;
  const row = document.createElement('tr');

  row.innerHTML = `
    <td style="text-align: center;">
      <input type="checkbox" class="remove-checkbox" checked>
    </td>
    <td><input type="text" value="${pid}" class="pid-input" readonly></td>
    <td><input type="number" value="${process?.arrival || 0}" min="0" class="arrival-input"></td>
    <td><input type="number" value="${process?.burst || 5}" min="1" class="burst-input"></td>
    <td><input type="number" value="${process?.priority || 1}" min="1" class="priority-input"></td>
    <td>
      <select class="queue-input">
        <option value="1" ${process?.queue === 1 ? 'selected' : ''}>1</option>
        <option value="2" ${process?.queue === 2 ? 'selected' : ''}>2</option>
        <option value="3" ${process?.queue === 3 ? 'selected' : ''}>3</option>
      </select>
    </td>
  `;

  elements.processBody.appendChild(row);
  return pid;
}

function getProcessData() {
  const rows = elements.processBody.querySelectorAll('tr');
  const data = [];
  let hasRemoveChecked = false;

  rows.forEach(row => {
    const removeCheckbox = row.querySelector('.remove-checkbox');
    if (removeCheckbox && !removeCheckbox.checked) {
      hasRemoveChecked = true;
      return;
    }

    const pid = row.querySelector('.pid-input').value.trim();
    const arrival = parseInt(row.querySelector('.arrival-input').value);
    const burst = parseInt(row.querySelector('.burst-input').value);
    const priority = parseInt(row.querySelector('.priority-input').value);
    const queue = parseInt(row.querySelector('.queue-input').value);

    if (pid) {
      data.push({ pid, arrival, burst, priority, queue });
    }
  });

  // If all rows removed, keep one empty row
  if (data.length === 0 && rows.length > 0) {
    addProcessRow();
    return [];
  }

  // Update row counter
  const maxPid = Math.max(...data.map(p => parseInt(p.pid.replace('P', ''))), 0);
  rowCounter = maxPid;

  return data;
}

elements.addRowBtn.addEventListener('click', () => {
  addProcessRow();
});

elements.clearAllBtn.addEventListener('click', () => {
  elements.processBody.innerHTML = '';
  addProcessRow();
  addProcessRow();
  processes = [];
  showValidationErrors([]);
  hideComparison();
});

// ============== Validation ==============

function showValidationErrors(errors) {
  const errorDiv = document.getElementById('validation-errors');
  errorDiv.textContent = errors.join(', ');
  errorDiv.style.display = errors.length ? 'block' : 'none';
}

function validateAndSanitize() {
  const data = getProcessData();
  const { valid, errors } = validateProcesses(data, { quantum: parseInt(elements.quantumInput.value) });

  if (!valid) {
    showValidationErrors(errors);
    elements.runSimBtn.disabled = true;
    elements.compareSelectedBtn.disabled = true;
    return { valid: false, errors };
  }

  showValidationErrors([]);
  elements.runSimBtn.disabled = data.length === 0;
  elements.compareSelectedBtn.disabled = data.length === 0;
  return { valid: true, data };
}

// ============== Sample Data ==============

const SAMPLE_DATA = [
  { pid: 'P1', arrival: 0, burst: 5, priority: 2, queue: 1 },
  { pid: 'P2', arrival: 1, burst: 3, priority: 1, queue: 2 },
  { pid: 'P3', arrival: 2, burst: 8, priority: 3, queue: 3 }
];

elements.loadSampleBtn.addEventListener('click', () => {
  elements.processBody.innerHTML = '';
  rowCounter = 0;
  SAMPLE_DATA.forEach(p => addProcessRow(p));
  processes = getProcessData();
  showValidationErrors([]);
});

// ============== Sample Data ==============

elements.loadSampleBtn.addEventListener('click', () => {
  elements.processBody.innerHTML = '';
  rowCounter = 0;

  SAMPLE_DATA.forEach(p => {
    addProcessRow(p);
  });

  processes = SAMPLE_DATA;
  showValidationErrors([]);
});

// ============== Simulation ==============

function renderGantt(result) {
  const timeline = elements.ganttTimeline;
  const timeLabels = elements.timeLabels;
  const legend = elements.ganttLegend;
  const logContent = elements.logContent;

  timeline.innerHTML = '';
  timeLabels.innerHTML = '';
  legend.innerHTML = '';

  if (!result || result.gantt.length === 0) return;

  // Calculate max time
  const maxTime = Math.max(...result.gantt.map(g => g.end));
  const timeStep = Math.max(1, Math.floor(maxTime / 10));

  // Create time labels
  for (let t = 0; t <= maxTime; t += timeStep) {
    const span = document.createElement('span');
    span.textContent = t;
    span.style.minWidth = '40px';
    timeLabels.appendChild(span);
  }

  // Calculate scale (pixels per time unit)
  const containerWidth = Math.max(timeline.offsetWidth, 600);
  const pxPerTime = (containerWidth - 50) / maxTime || 40;

  // Render Gantt blocks
  const seenPids = new Set();

  result.gantt.forEach(entry => {
    const block = document.createElement('div');
    block.className = 'gantt-block' + (entry.isIdle ? ' idle' : '');
    block.dataset.pid = entry.pid;
    block.dataset.start = entry.start;
    block.dataset.end = entry.end;

    const width = (entry.end - entry.start) * pxPerTime;
    const left = entry.start * pxPerTime;

    block.style.width = Math.max(40, width) + 'px';
    block.style.left = left + 'px';

    if (!entry.isIdle && entry.pid !== 'IDLE') {
      block.textContent = entry.pid;
      if (!seenPids.has(entry.pid)) {
        seenPids.add(entry.pid);
        // Add to legend
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
          <div class="legend-color" style="background: ${getProcessColor(entry.pid)}"></div>
          <span>${entry.pid}</span>
        `;
        legend.appendChild(legendItem);
      }
    }

    timeline.appendChild(block);
  });

  // Render log
  logContent.innerHTML = '';
  result.log.forEach(entry => {
    const line = document.createElement('div');
    line.className = 'log-entry';
    line.innerHTML = `
      <span class="log-time">[${entry.time}]</span>
      <span class="log-event">${entry.event}:</span>
      ${entry.detail}
    `;
    logContent.appendChild(line);
  });
}

function getProcessColor(pid) {
  const colors = [
    '#2563eb', '#16a34a', '#ea580c', '#9333ea',
    '#ec4899', '#0891b2', '#65a30d', '#dc2626'
  ];
  const num = parseInt(pid.replace('P', '')) || 1;
  return colors[(num - 1) % colors.length];
}

function renderResults(result) {
  const tbody = elements.resultsBody;
  tbody.innerHTML = '';

  result.processes.forEach(proc => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="pid-col">${proc.pid}</td>
      <td>${proc.arrival}</td>
      <td>${proc.burst}</td>
      <td>${proc.completion}</td>
      <td>${proc.turnaround.toFixed(2)}</td>
      <td>${proc.waiting.toFixed(2)}</td>
      <td>${proc.response.toFixed(2)}</td>
    `;
    tbody.appendChild(row);
  });

  // Averages
  elements.avgWaiting.textContent = result.averages.waiting.toFixed(2);
  elements.avgTurnaround.textContent = result.averages.turnaround.toFixed(2);
  elements.avgResponse.textContent = result.averages.response.toFixed(2);

  // Idle time info
  if (result.averages.idleTime > 0) {
    elements.idleInfo.textContent = `CPU Idle Time: ${result.averages.idleTime} time units`;
  } else {
    elements.idleInfo.textContent = '';
  }
}

function renderAverages(result) {
  const averagesDiv = document.getElementById('averages');
  averagesDiv.innerHTML = '';

  const stats = [
    { label: 'Waiting Time', value: result.averages.waiting.toFixed(2) },
    { label: 'Turnaround Time', value: result.averages.turnaround.toFixed(2) },
    { label: 'Response Time', value: result.averages.response.toFixed(2) }
  ];

  stats.forEach(stat => {
    const div = document.createElement('div');
    div.className = 'avg-stat';
    div.innerHTML = `
      <div class="avg-stat-value">${stat.value}</div>
      <div class="avg-stat-label">${stat.label}</div>
    `;
    averagesDiv.appendChild(div);
  });
}

function runSimulation(algorithm) {
  const { valid, data } = validateAndSanitize();

  if (!valid || data.length === 0) {
    return;
  }

  const quantum = parseInt(elements.quantumInput.value);
  const result = runScheduler(data, algorithm, quantum);

  lastResult = result;
  renderGantt(result);
  renderResults(result);
  renderAverages(result);

  return result;
}

elements.runSimBtn.addEventListener('click', () => {
  const algorithm = elements.algorithmSelect.value;
  runSimulation(algorithm);
});

// ============== Algorithm Comparison ==============

function renderComparison(results) {
  const tbody = elements.comparisonBody;
  tbody.innerHTML = '';

  if (results.length === 0) return;

  elements.comparisonSection.classList.add('visible');

  // Find min values
  const minWT = Math.min(...results.map(r => r.averages.waiting));
  const minTAT = Math.min(...results.map(r => r.averages.turnaround));
  const minRT = Math.min(...results.map(r => r.averages.response));

  results.forEach(result => {
    const row = document.createElement('tr');
    const isBestWT = result.averages.waiting === minWT;
    const isBestTAT = result.averages.turnaround === minTAT;
    const isBestRT = result.averages.response === minRT;

    row.innerHTML = `
      <td>${result.algorithm}</td>
      <td class="${isBestWT ? 'best-value' : ''}">${result.averages.waiting.toFixed(2)}</td>
      <td class="${isBestTAT ? 'best-value' : ''}">${result.averages.turnaround.toFixed(2)}</td>
      <td class="${isBestRT ? 'best-value' : ''}">${result.averages.response.toFixed(2)}</td>
      <td>${isBestWT || isBestTAT || isBestRT ? '✓ Best' : ''}</td>
    `;
    tbody.appendChild(row);
  });
}

function hideComparison() {
  elements.comparisonSection.classList.remove('visible');
}

elements.compareSelectedBtn.addEventListener('click', () => {
  const checked = Array.from(document.querySelectorAll('.comparison-controls input[type="checkbox"]:checked'));

  if (checked.length < 2) {
    alert('Please select at least 2 algorithms to compare');
    return;
  }

  const { valid, data } = validateAndSanitize();
  if (!valid || data.length === 0) return;

  const quantum = parseInt(elements.quantumInput.value);
  const comparison = checked.map(cb => cb.value).map(algo => {
    const result = runScheduler(data, algo, quantum);
    return { algorithm: algo, averages: result.averages };
  });

  renderComparison(comparison);
});

// ============== Initialization ==============

function init() {
  // Add initial rows
  addProcessRow();
  addProcessRow();

  // Initialize theme
  initTheme();

  // Validate on input change
  elements.processBody.addEventListener('input', () => {
    validateAndSanitize();
  });
  elements.quantumInput.addEventListener('input', () => {
    validateAndSanitize();
  });

  // Initial validation
  validateAndSanitize();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);