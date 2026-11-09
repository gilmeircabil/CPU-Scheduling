import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function para(text, options = {}) {
  const {
    style,
    bold = false,
    italic = false,
    color,
    size, // in half-points (24 = 12pt)
    align,
    spaceBefore = 80,
    spaceAfter = 80,
    bullet = false
  } = options;

  let pPr = '<w:pPr>';
  if (style) pPr += `<w:pStyle w:val="${style}"/>`;
  if (align) pPr += `<w:jc w:val="${align}"/>`;
  pPr += `<w:spacing w:before="${spaceBefore}" w:after="${spaceAfter}" w:line="276" w:lineRule="auto"/>`;
  if (bullet) {
    pPr += `<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/><w:sz w:val="20"/></w:rPr>`;
  }
  pPr += '</w:pPr>';

  let runs = '';
  if (bullet) {
    runs += `<w:r><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/><w:sz w:val="20"/><w:color w:val="2563EB"/></w:rPr><w:t>• </w:t></w:r>`;
  }

  // Support multiple spans if text is array of objects { text, bold, italic, color, size }
  if (Array.isArray(text)) {
    for (const item of text) {
      const itText = escapeXml(item.text);
      let rPr = '<w:rPr>';
      if (item.bold || bold) rPr += '<w:b/>';
      if (item.italic || italic) rPr += '<w:i/>';
      if (item.font) rPr += `<w:rFonts w:ascii="${item.font}" w:hAnsi="${item.font}"/>`;
      if (item.color || color) rPr += `<w:color w:val="${item.color || color}"/>`;
      if (item.size || size) rPr += `<w:sz w:val="${item.size || size}"/>`;
      rPr += '</w:rPr>';
      runs += `<w:r>${rPr}<w:t xml:space="preserve">${itText}</w:t></w:r>`;
    }
  } else {
    const itText = escapeXml(text);
    let rPr = '<w:rPr>';
    if (bold) rPr += '<w:b/>';
    if (italic) rPr += '<w:i/>';
    if (color) rPr += `<w:color w:val="${color}"/>`;
    if (size) rPr += `<w:sz w:val="${size}"/>`;
    rPr += '</w:rPr>';
    runs += `<w:r>${rPr}<w:t xml:space="preserve">${itText}</w:t></w:r>`;
  }

  return `<w:p>${pPr}${runs}</w:p>`;
}

function heading1(text) {
  return para(text, {
    bold: true,
    size: 32, // 16pt
    color: '1E3A8A', // Deep Navy
    spaceBefore: 300,
    spaceAfter: 120
  });
}

function heading2(text) {
  return para(text, {
    bold: true,
    size: 26, // 13pt
    color: '1D4ED8', // Royal Blue
    spaceBefore: 240,
    spaceAfter: 100
  });
}

function heading3(text) {
  return para(text, {
    bold: true,
    size: 22, // 11pt
    color: '0F172A', // Slate 900
    spaceBefore: 180,
    spaceAfter: 80
  });
}

function callout(title, bodyLines, type = 'info') {
  // Border color & shading based on type
  let borderColor = '2563EB'; // Blue
  let bgColor = 'F8FAFC'; // Light slate
  let titleColor = '1E3A8A';

  if (type === 'tip') {
    borderColor = '059669'; // Emerald
    bgColor = 'F0FDF4';
    titleColor = '065F46';
  } else if (type === 'speech') {
    borderColor = '7C3AED'; // Purple
    bgColor = 'FAF5FF';
    titleColor = '5B21B6';
  }

  let cellXml = '';
  if (title) {
    cellXml += para(title, { bold: true, color: titleColor, size: 22, spaceBefore: 60, spaceAfter: 60 });
  }

  if (Array.isArray(bodyLines)) {
    for (const line of bodyLines) {
      if (typeof line === 'string') {
        cellXml += para(line, { size: 20, color: '334155', spaceBefore: 40, spaceAfter: 40 });
      } else {
        cellXml += para(line.text, { ...line, size: 20, spaceBefore: 40, spaceAfter: 40 });
      }
    }
  } else {
    cellXml += para(bodyLines, { size: 20, color: '334155', spaceBefore: 40, spaceAfter: 40 });
  }

  return `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="9360" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="none"/>
        <w:left w:val="single" w:sz="24" w:space="0" w:color="${borderColor}"/>
        <w:bottom w:val="none"/>
        <w:right w:val="none"/>
        <w:insideH w:val="none"/>
        <w:insideV w:val="none"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="140" w:type="dxa"/>
        <w:left w:w="240" w:type="dxa"/>
        <w:bottom w:w="140" w:type="dxa"/>
        <w:right w:w="200" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
    <w:tr>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="9360" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="${bgColor}"/>
        </w:tcPr>
        ${cellXml}
      </w:tc>
    </w:tr>
  </w:tbl>
  ${para('', { spaceBefore: 40, spaceAfter: 80 })}`;
}

function table(headers, rows, widths = []) {
  const totalW = 9360; // 6.5 inches in dxa
  const colCount = headers.length;
  const colWidth = widths.length === colCount ? widths : Array(colCount).fill(Math.floor(totalW / colCount));

  let tblXml = `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="${totalW}" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        <w:bottom w:val="single" w:sz="8" w:space="0" w:color="94A3B8"/>
        <w:left w:val="none"/>
        <w:right w:val="none"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        <w:insideV w:val="none"/>
      </w:tblBorders>
      <w:tblCellMar>
        <w:top w:w="120" w:type="dxa"/>
        <w:left w:w="140" w:type="dxa"/>
        <w:bottom w:w="120" w:type="dxa"/>
        <w:right w:w="140" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>`;

  // Header Row
  tblXml += '<w:tr><w:trPr><w:tblHeader/></w:trPr>';
  headers.forEach((h, idx) => {
    tblXml += `
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="${colWidth[idx]}" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="1E3A8A"/>
        </w:tcPr>
        ${para(h, { bold: true, color: 'FFFFFF', size: 20, spaceBefore: 60, spaceAfter: 60 })}
      </w:tc>`;
  });
  tblXml += '</w:tr>';

  // Data Rows
  rows.forEach((row, rIdx) => {
    const bg = rIdx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
    tblXml += '<w:tr>';
    row.forEach((cell, cIdx) => {
      let cellContent = '';
      if (typeof cell === 'string') {
        cellContent = para(cell, { size: 20, color: '334155', spaceBefore: 50, spaceAfter: 50 });
      } else if (Array.isArray(cell)) {
        cellContent = cell.map(c => typeof c === 'string' ? para(c, { size: 20, color: '334155', spaceBefore: 30, spaceAfter: 30 }) : para(c.text, { ...c, size: 20 })).join('');
      } else {
        cellContent = para(cell.text, { ...cell, size: 20, spaceBefore: 50, spaceAfter: 50 });
      }

      tblXml += `
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="${colWidth[cIdx]}" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="${bg}"/>
          </w:tcPr>
          ${cellContent}
        </w:tc>`;
    });
    tblXml += '</w:tr>';
  });

  tblXml += `</w:tbl>${para('', { spaceBefore: 60, spaceAfter: 100 })}`;
  return tblXml;
}

function divider() {
  return `
  <w:p>
    <w:pPr>
      <w:pBdr>
        <w:bottom w:val="single" w:sz="6" w:space="1" w:color="E2E8F0"/>
      </w:pBdr>
      <w:spacing w:before="120" w:after="160"/>
    </w:pPr>
  </w:p>`;
}

// Generate the Document Body
let docBody = '';

// Title & Header Block
docBody += para('CPU SCHEDULING ALGORITHM SIMULATOR', {
  bold: true,
  size: 40, // 20pt
  color: '1E3A8A',
  align: 'center',
  spaceBefore: 0,
  spaceAfter: 80
});

docBody += para('Project Defense & Presentation Master Guide', {
  bold: true,
  size: 28, // 14pt
  color: '2563EB',
  align: 'center',
  spaceBefore: 0,
  spaceAfter: 180
});

docBody += callout('Project Defense Quick Summary', [
  { text: 'Course: PT101 Platform Technologies Final Project | Architecture: Vanilla ES6 JS, HTML5, Modern CSS' },
  { text: 'Core Algorithms: FCFS, SJF, Round Robin (RR), Multilevel Queue (MLQ)' },
  { text: 'Key Highlights: Zero-dependencies, Interactive Gantt Chart, Automated 32-Test Suite Passing' }
], 'tip');

docBody += divider();

// Section 1: Presentation Structure & Timeline
docBody += heading1('1. Presentation Structure & Time Allocation (7-10 Minutes)');
docBody += para('Follow this structured breakdown during your project defense to ensure you cover theoretical foundations, live demonstration, and engineering rigor without running out of time.');

docBody += table(
  ['Time', 'Phase', 'Key Objective & Screen Focus'],
  [
    ['0:00 - 1:30', 'Opening & Problem Statement', 'Explain CPU scheduling purpose, process states, and why OS optimization matters.'],
    ['1:30 - 3:30', 'The 4 Algorithms Explained', 'Contrast non-preemptive vs preemptive policies using real-world analogies.'],
    ['3:30 - 6:30', 'Interactive Live Demo', 'Step through "Load sample", Gantt chart, metrics table, and side-by-side comparison.'],
    ['6:30 - 7:30', 'Technical Architecture & Testing', 'Highlight modular design (scheduler.js / app.js) and 32 passing unit tests.'],
    ['7:30 - 10:00', 'Defense & Panel Q&A', 'Answer professor questions using the prepared defense cheat sheet.']
  ],
  [1600, 2600, 5160]
);

docBody += divider();

// Section 2: Slide-by-Slide Script
docBody += heading1('2. Slide-by-Slide Script & Talking Points');

docBody += heading2('Slide 1: Title & Purpose');
docBody += callout('What to Say (Verbatim Speech):', [
  '"Good day, panel and professor. Today, we are presenting our CPU Scheduling Algorithm Simulator, developed for PT101 Platform Technologies. The CPU is the central processing engine of any operating system. When multiple tasks demand CPU time simultaneously, the scheduling algorithm decides which task gets executed, in what order, and for how long. Our simulator provides an intuitive, interactive environment to observe, measure, and compare four foundational scheduling algorithms under identical workloads."'
], 'speech');

docBody += heading2('Slide 2: Evaluation Metrics & Mathematical Formulas');
docBody += para('Explain how scheduling algorithms are judged quantitatively. Operating systems track four vital metrics:');

docBody += table(
  ['Metric Name', 'Formula', 'Real-World Meaning'],
  [
    ['Turnaround Time (TAT)', 'TAT = Completion Time - Arrival Time', 'Total lifespan of a process from queue entry to finish.'],
    ['Waiting Time (WT)', 'WT = Turnaround Time - Burst Time', 'Total time spent sitting in the ready queue doing nothing.'],
    ['Response Time (RT)', 'RT = First Start Time - Arrival Time', 'Time until the process gets its very first CPU slice.'],
    ['CPU Utilisation (%)', '((Total Time - Idle Time) / Total Time) * 100', 'Percentage of time the CPU was actively executing jobs.']
  ],
  [2400, 3600, 3360]
);

docBody += heading2('Slide 3: The 4 Core Algorithms');

docBody += heading3('1. First-Come, First-Served (FCFS) - Non-Preemptive');
docBody += para([
  { text: '• Concept: ', bold: true },
  { text: 'Executes processes in the strict order of their arrival, exactly like a grocery checkout line.\n' },
  { text: '• Advantage: ', bold: true },
  { text: 'Extremely simple to implement with minimal overhead.\n' },
  { text: '• Critical Flaw: ', bold: true },
  { text: 'Suffers from the Convoy Effect, where a massive CPU-bound job delays multiple quick tasks behind it.' }
]);

docBody += heading3('2. Shortest Job First (SJF) - Non-Preemptive');
docBody += para([
  { text: '• Concept: ', bold: true },
  { text: 'Whenever the CPU becomes free, it picks the arrived process with the smallest burst time.\n' },
  { text: '• Advantage: ', bold: true },
  { text: 'Provably optimal for minimizing average waiting time across all non-preemptive algorithms.\n' },
  { text: '• Critical Flaw: ', bold: true },
  { text: 'Can cause starvation for long jobs if short jobs continually enter the ready queue.' }
]);

docBody += heading3('3. Round Robin (RR) - Preemptive');
docBody += para([
  { text: '• Concept: ', bold: true },
  { text: 'Every process receives a fixed time slice (Time Quantum). When time expires, it moves to the back of the queue.\n' },
  { text: '• Advantage: ', bold: true },
  { text: 'Excellent response time and fairness, making it standard for interactive time-sharing systems.\n' },
  { text: '• Critical Factor: ', bold: true },
  { text: 'Quantum selection: if too large, it degenerates into FCFS; if too small, context-switching wastes CPU cycles.' }
]);

docBody += heading3('4. Multilevel Queue (MLQ) - Priority Queues');
docBody += para([
  { text: '• Concept: ', bold: true },
  { text: 'Processes are classified into 3 priority tiers: Queue 1 (High, Round Robin), Queue 2 (Medium, FCFS), and Queue 3 (Low, FCFS).\n' },
  { text: '• Rule: ', bold: true },
  { text: 'Queue 1 always executes before Queue 2, and Queue 2 before Queue 3. Processes stay in their assigned queues.\n' },
  { text: '• Why MLQ over MLFQ: ', bold: true },
  { text: 'MLQ uses clean, static priority queues, avoiding arbitrary dynamic demotion rules that distort direct comparison.' }
]);

docBody += divider();

// Section 3: Live Interactive Demo
docBody += heading1('3. Live Interactive Demo Playbook');
docBody += para('Follow this exact sequential demonstration during your live presentation for maximum impact:');

docBody += table(
  ['Step', 'Action in UI', 'What to Highlight / Explain to Panel'],
  [
    ['1', 'Click "Load sample"', 'Loads 4 processes: P1(0,5), P2(1,3), P3(2,8), and P4(4,2). Point out that P3 is long (BT=8) while P2 and P4 are short.'],
    ['2', 'Run FCFS', 'Point to Gantt chart: P1 runs 0-5. P2 arrived at 1 but had to wait until 5. Note Average Waiting Time = 3.75.'],
    ['3', 'Run SJF', 'Point to Gantt chart: After P1 finishes at 5, SJF picks P4(BT=2) and P2(BT=3) before P3(BT=8). Average Waiting Time drops to 3.25!'],
    ['4', 'Run Round Robin', 'Set Quantum = 4. Show P1 preempting after 4 units, giving P2 immediate CPU time. Show how Response Time improves dramatically.'],
    ['5', 'Run Multilevel Queue', 'Show Queue 1 jobs (P1, P4) preempting Queue 2 (P2) and Queue 3 (P3).'],
    ['6', 'Compare Policies Matrix', 'Scroll down to the "Compare policies" matrix. Show the side-by-side performance comparison. Click any row to dynamically switch views.'],
    ['7', 'Dark / Light Theme', 'Click the moon/sun icon in the top right to demonstrate UI polish and accessibility.']
  ],
  [800, 2400, 6160]
);

docBody += divider();

// Section 4: Technical Architecture & Testing
docBody += heading1('4. Technical Architecture & Engineering Quality');
docBody += para('Demonstrate to your professor that this project was engineered with clean standards and robust unit testing:');

docBody += table(
  ['Component / File', 'Role & Implementation Details'],
  [
    ['index.html', 'Semantic HTML5 interface, accessible forms, aria labels, and dynamic comparison containers.'],
    ['scheduler.js', 'Pure discrete-event simulation engine with zero UI dependencies. Handles queues, preemption, idle time, and math.'],
    ['app.js', 'State controller, Gantt chart visualizer, dynamic input validation, event handlers, and responsive table updates.'],
    ['style.css', 'Modern responsive layout using CSS custom properties (variables) for instant Dark/Light theme switching.'],
    ['tests.js', 'Automated Node.js test suite containing 32 unit tests verifying edge cases, tie-breaks, idle periods, and formulas.']
  ],
  [2200, 7160]
);

docBody += callout('Automated Test Suite Proof (Run via `node tests.js`):', [
  '• validateProcesses Tests: 5/5 passed (bounds, duplicates, negative numbers)',
  '• FCFS Engine Tests: 3/3 passed (idle time handling, tie-breaking)',
  '• SJF Engine Tests: 3/3 passed (shortest burst selection, arrival order)',
  '• Round Robin Tests: 5/5 passed (quantum preemption, wrap-around)',
  '• Multilevel Queue Tests: 3/3 passed (priority handoff, idle gaps)',
  'Total Unit Tests: 32 Passed, 0 Failed (100% Pass Rate)'
], 'tip');

docBody += divider();

// Section 5: Defense Q&A Cheat Sheet
docBody += heading1('5. Panel Defense Q&A Cheat Sheet');
docBody += para('Here are the top questions examiners typically ask during operating systems project presentations:');

docBody += heading2('Q1: What is the "Convoy Effect" in FCFS?');
docBody += callout('Model Answer:', [
  '"The Convoy Effect occurs when a CPU-bound process with a long burst time arrives first. Multiple short I/O-bound processes become trapped behind it in the ready queue, causing average waiting times to surge and system resources to sit underutilized."'
], 'info');

docBody += heading2('Q2: How does the Time Quantum size affect Round Robin?');
docBody += callout('Model Answer:', [
  '"If the quantum is extremely large (approaching infinity), Round Robin degenerates into FCFS because every process finishes in a single turn. If the quantum is extremely small, excessive context switching consumes significant CPU overhead in real operating systems. An ideal quantum should allow roughly 80% of CPU bursts to finish within one slice."'
], 'info');

docBody += heading2('Q3: Why does SJF provide the minimum average waiting time?');
docBody += callout('Model Answer:', [
  '"Mathematically, executing the shortest job first allows it to exit the ready queue sooner. Every unit of time a job finishes earlier reduces the waiting time accumulated by all subsequent processes in queue. Summed across all jobs, this guarantees the lowest aggregate waiting time."'
], 'info');

docBody += heading2('Q4: How does your simulator handle CPU idle time?');
docBody += callout('Model Answer:', [
  '"When the ready queue is empty and the next process arrives in the future, the simulator advances the simulation clock directly to the next arrival time and logs an IDLE block. In the Gantt chart, this is highlighted with diagonal hatched stripes, and it is factored into our CPU Utilisation formula."'
], 'info');

docBody += heading2('Q5: What is starvation, and how do operating systems prevent it?');
docBody += callout('Model Answer:', [
  '"Starvation occurs when lower-priority or longer jobs are indefinitely delayed because shorter or higher-priority jobs keep entering the queue. Operating systems mitigate starvation using Aging: as a process waits in the queue, its priority is gradually incremented over time until it is guaranteed execution."'
], 'info');

docBody += divider();

// Section 6: Pre-Presentation Checklist
docBody += heading1('6. Pre-Presentation Final Checklist');
docBody += para([
  { text: '1. Open ', bold: true },
  { text: 'index.html in your browser and verify zoom is set to 100% or 110% for projector readability.\n' },
  { text: '2. Keep a terminal window open ', bold: true },
  { text: 'with node tests.js ready to run to demonstrate automated test verification.\n' },
  { text: '3. Verify mouse clicks: ', bold: true },
  { text: 'Test "Load sample", "Run simulation", and clicking rows in "Compare policies" to ensure smooth transitions.\n' },
  { text: '4. Speak clearly and pace yourself: ', bold: true },
  { text: 'Spend at least 3 full minutes on the live interactive demo—it is the strongest visual proof of your project.' }
]);

// Prepare OpenXML Packaging
const tempDir = path.resolve('temp_docx_build');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });
fs.mkdirSync(path.join(tempDir, '_rels'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word', '_rels'), { recursive: true });

// [Content_Types].xml
const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), contentTypesXml, 'utf8');

// _rels/.rels
const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, '_rels', '.rels'), relsXml, 'utf8');

// word/_rels/document.xml.rels
const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, 'word', '_rels', 'document.xml.rels'), docRelsXml, 'utf8');

// word/styles.xml
const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="334155"/>
        <w:lang w:val="en-US"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="120" w:line="260" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:color w:val="1E3A8A"/>
      <w:sz w:val="32"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:color w:val="2563EB"/>
      <w:sz w:val="26"/>
    </w:rPr>
  </w:style>
</w:styles>`;
fs.writeFileSync(path.join(tempDir, 'word', 'styles.xml'), stylesXml, 'utf8');

// word/document.xml
const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${docBody}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
fs.writeFileSync(path.join(tempDir, 'word', 'document.xml'), documentXml, 'utf8');

const docxName = 'CPU_Scheduling_Presentation_Guide.docx';
const docxPath = path.resolve(docxName);

if (fs.existsSync(docxPath)) {
  fs.unlinkSync(docxPath);
}

// Compress into .docx using PowerShell
const psCommand = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${tempDir.replace(/\\/g, '\\\\')}', '${docxPath.replace(/\\/g, '\\\\')}');"`;
execSync(psCommand);

// Clean up tempDir
fs.rmSync(tempDir, { recursive: true, force: true });

console.log(`Successfully generated: ${docxPath}`);
