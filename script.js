/* =============================================
   PomoPlan — script.js
   Shared JavaScript for all pages
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Hamburger menu ── */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target))
        navLinks.classList.remove('open');
    });
  }

  /* ── Planner form ── */
  const plannerForm = document.getElementById('plannerForm');
  if (plannerForm) plannerForm.addEventListener('submit', handlePlanner);

  /* ── Contact form ── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', handleContact);
});

/* ==============================================
   PLANNER ALGORITHM
   ============================================== */

/* Sleep modifier — reduces work block when tired */
function sleepMod(hours) {
  if (hours >= 8) return 1.0;
  if (hours >= 6) return 0.9;
  if (hours >= 4) return 0.75;
  return 0.6;
}

/* Base work block length adjusted for sleep */
function workBlock(energy, sleep) {
  const base = energy <= 3 ? 15 : energy <= 6 ? 25 : energy <= 8 ? 30 : 45;
  return Math.round(base * sleepMod(sleep));
}

/* Break length based on energy and urgency */
function breakLen(energy, urgency, isLong) {
  if (isLong) return urgency === 'critical' ? 10 : energy <= 3 ? 20 : 15;
  return urgency === 'critical' ? 3 : energy <= 3 ? 10 : 5;
}

/* Strategy message */
function getStrategy(urgency, energy) {
  const strategies = {
    critical: [
      '<img src="assets/images/icons/deadline.svg" alt="critical" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Maximum focus — every second counts. Keep sessions tight.',
      '<img src="assets/images/icons/deadline.svg" alt="critical" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Push through strategically. Minimum breaks, maximum output.',
      '<img src="assets/images/icons/deadline.svg" alt="critical" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Critical mode on. Stay disciplined and avoid distractions.'
    ],
    high: [
      '<img src="assets/images/icons/energy.svg" alt="high" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Deadline tomorrow — prioritise your most important material.',
      '<img src="assets/images/icons/energy.svg" alt="high" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Elevated focus mode. Progress over perfection.',
      '<img src="assets/images/icons/energy.svg" alt="high" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Stay disciplined during breaks. You are almost there.'
    ],
    medium: [
      '<img src="assets/images/icons/clock.svg" alt="medium" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Steady, sustainable pace. Balance depth with recovery.',
      '<img src="assets/images/icons/clock.svg" alt="medium" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Consistent effort beats last-minute cramming. You have got this!',
      '<img src="assets/images/icons/clock.svg" alt="medium" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Take it one block at a time. Consistency is the key.'
    ],
    low: [
      '<img src="assets/images/icons/sleep.svg" alt="low" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Relax and explore the material deeply. No rush today.',
      '<img src="assets/images/icons/sleep.svg" alt="low" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Longer breaks are fine. Enjoy the learning process.',
      '<img src="assets/images/icons/sleep.svg" alt="low" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Deep work mode — go as far as curiosity takes you.'
    ]
  };
  const arr = strategies[urgency] || strategies.medium;
  return arr[energy <= 3 ? 2 : energy <= 6 ? 1 : 0];
}

/* Energy badge */
function energyBadge(e) {
  if (e <= 3) return '<span class="badge b-red"><img src="assets/images/icons/sleep.svg" alt="low energy" style="width:12px;height:12px;vertical-align:middle;margin-right:3px;filter:brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(600%) hue-rotate(330deg);"> Low</span>';
  if (e <= 6) return '<span class="badge b-amber"><img src="assets/images/icons/energy.svg" alt="medium energy" style="width:12px;height:12px;vertical-align:middle;margin-right:3px;"> Medium</span>';
  return '<span class="badge b-green"><img src="assets/images/icons/momentum.svg" alt="high energy" style="width:12px;height:12px;vertical-align:middle;margin-right:3px;"> High</span>';
}

/* Build the full plan object */
function buildPlan(energy, sleep, time, urgency, subject) {
  const totalMins = Math.round(time * 60);
  const wb = workBlock(energy, sleep);
  const sb = breakLen(energy, urgency, false);
  const lb = breakLen(energy, urgency, true);
  const blocks = [];
  let elapsed = 0, count = 0;

  while (elapsed + wb <= totalMins) {
    count++;
    blocks.push({ type: 'work', duration: wb, index: count });
    elapsed += wb;
    const isLong = (count % 4 === 0);
    const br = isLong ? lb : sb;
    if (elapsed + br <= totalMins) {
      blocks.push({ type: 'break', duration: br, index: count, isLong });
      elapsed += br;
    } else break;
  }

  return {
    energy, sleep, urgency, subject,
    wb, sb, lb, blocks, count,
    strategy: getStrategy(urgency, energy),
    totalStudy: count * wb,
    sm: sleepMod(sleep)
  };
}

/* Handle planner form submit */
function handlePlanner(e) {
  e.preventDefault();
  const energy = parseInt(document.getElementById('energy').value);
  const sleep = parseFloat(document.getElementById('sleep').value) || 7;
  const time = parseFloat(document.getElementById('timeAvail').value) || 2;
  const urgency = document.getElementById('urgency').value;
  const subject = document.getElementById('subject').value.trim() || 'Study Session';

  if (!urgency) { alert('Please select a deadline urgency level.'); return; }
  if (time <= 0) { alert('Please enter a valid amount of time.'); return; }

  renderPlan(buildPlan(energy, sleep, time, urgency, subject));
}

/* Render results into the page */
function renderPlan(p) {
  document.getElementById('resultsEmpty').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';
  document.getElementById('scheduleWrap').style.display = 'block';

  /* Pomodoro chips */
  const chips = p.blocks.map(b =>
    b.type === 'work'
      ? `<span class="chip chip-w"><img src="assets/images/icons/clock.svg" alt="work" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"> Pomo ${b.index} · ${b.duration}m</span>`
      : `<span class="chip chip-b"><img src="assets/images/icons/${b.isLong ? 'music' : 'water'}.svg" alt="${b.isLong ? 'long break' : 'short break'}" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"> ${b.isLong ? 'Long' : 'Short'} break · ${b.duration}m</span>`
  ).join('');

  /* Low sleep warning */
  const warn = p.sleep < 6
    ? `<div style="background:rgba(224,92,92,.12);border:1.5px solid rgba(224,92,92,.25);border-radius:14px;padding:.75rem 1rem;margin-bottom:1.2rem;font-size:.83rem;color:#ffb3b3;">
       <strong>Low sleep detected (${p.sleep}h).</strong> Work blocks shortened by ${Math.round((1 - p.sm) * 100)}% to protect your focus.
       </div>` : '';

  document.getElementById('resultsContent').innerHTML = `
    ${warn}
    <div class="r-block">
      <div class="r-label">Subject</div>
      <p><strong>${p.subject}</strong> ${energyBadge(p.energy)}</p>
    </div>
    <div class="r-block">
      <div class="r-label">Today's Strategy</div>
      <p>${p.strategy}</p>
    </div>
    <div class="r-block">
      <div class="r-label">Summary</div>
      <p>
        <strong>${p.count}</strong> Pomodoro${p.count !== 1 ? 's' : ''} &nbsp;·&nbsp;
        <strong>${p.totalStudy} min</strong> focused study &nbsp;·&nbsp;
        Work: <strong>${p.wb}m</strong> &nbsp;·&nbsp;
        Short break: <strong>${p.sb}m</strong> &nbsp;·&nbsp;
        Long break: <strong>${p.lb}m</strong>
      </p>
    </div>
    <div class="r-block">
      <div class="r-label">Your Blocks</div>
      <div class="chips">${chips || '<span style="opacity:.6;font-size:.85rem;">No blocks fit — try increasing time available.</span>'}</div>
    </div>`;

  /* Session schedule table */
  let t = new Date(); t.setSeconds(0, 0);
  const fmt = d => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const addM = (d, m) => new Date(d.getTime() + m * 60000);

  const rows = p.blocks.map(b => {
    const start = fmt(t); t = addM(t, b.duration); const end = fmt(t);
    const label = b.type === 'work'
      ? `<img src="assets/images/icons/clock.svg" alt="work" style="width:14px;height:14px;vertical-align:middle;margin-right:5px;"> Work Block (Pomo ${b.index})`
      : b.isLong ? '<img src="assets/images/icons/music.svg" alt="long break" style="width:14px;height:14px;vertical-align:middle;margin-right:5px;"> Long Break' : '<img src="assets/images/icons/water.svg" alt="short break" style="width:14px;height:14px;vertical-align:middle;margin-right:5px;"> Short Break';
    const rowBg = b.type !== 'work' ? 'style="background:var(--green-pale)"' : '';
    return `<tr ${rowBg}><td>${start} – ${end}</td><td>${label}</td><td>${b.duration} min</td><td>${b.type === 'work' ? p.subject : '—'}</td></tr>`;
  }).join('');

  document.getElementById('scheduleTable').innerHTML = `
    <table>
      <thead><tr><th>Time Slot</th><th>Block</th><th>Duration</th><th>Task</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:1.5rem;">No blocks fit — please increase time available.</td></tr>'}</tbody>
    </table>`;
}

/* ==============================================
   CONTACT FORM
   ============================================== */
function handleContact(e) {
  e.preventDefault();
  const name = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject_c').value;
  const message = document.getElementById('message').value.trim();
  const terms = document.getElementById('terms').checked;

  if (!name || !email || !subject || !message) {
    alert('Please fill in all required fields.'); return;
  }
  if (!terms) { alert('Please check the agreement checkbox.'); return; }
  if (!email.includes('@')) { alert('Please enter a valid email address.'); return; }

  const subjectLabel = {
    general: 'General Question',
    feedback: 'Feedback about PomoPlan',
    feature: 'Feature Request',
    bug: 'Bug Report',
    other: 'Other'
  }[subject] || subject;

  const body = `Name: ${name}\nEmail: ${email}\nSubject: ${subjectLabel}\n\nMessage:\n${message}`;
  const mailtoLink = `mailto:slayersplan@gmail.com?subject=${encodeURIComponent('[PomoPlan] ' + subjectLabel)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;

  const ok = document.getElementById('formSuccess');
  ok.style.display = 'block';
  e.target.reset();
  setTimeout(() => { ok.style.display = 'none'; }, 5000);
}
