document.addEventListener('DOMContentLoaded', function() {

  /* -- Hamburger menu -- */
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      navLinks.classList.toggle('open');
    });
    document.addEventListener('click', function(e) {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  /* -- Planner form -- */
  var plannerForm = document.getElementById('plannerForm');
  if (plannerForm) plannerForm.addEventListener('submit', handlePlanner);

  /* -- Contact form -- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) contactForm.addEventListener('submit', handleContact);
});

/* pomo algorithm */

function sleepMod(hours) {
  if (hours >= 8) return 1.0;   
  if (hours >= 6) return 0.9;   
  if (hours >= 4) return 0.75;  
  return 0.6;                   
}

function workBlock(energy, sleep) {
  var base;
  if (energy <= 3)      base = 15;  
  else if (energy <= 6) base = 25;  
  else if (energy <= 8) base = 30;  
  else                  base = 45;  
  return Math.round(base * sleepMod(sleep));
}

function shortBreak(energy, sleep) {
  var base;
  if (energy <= 3)      base = 10;  
  else if (energy <= 8) base = 5;   
  else                  base = 10;  
  return Math.round(base * sleepMod(sleep));
}

function longBreak(energy, sleep) {
  var base;
  if (energy <= 3)      base = 20;  // low energy
  else if (energy <= 8) base = 15;  // medium / high
  else                  base = 20;  // peak
  return Math.round(base * sleepMod(sleep));
}

function getStrategy(urgency, energy) {
  var strategies = {
    critical: [
      '<img src="assets/images/icons/deadline.svg" alt="critical" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Maximum focus — every second counts. Keep sessions tight.',
      '<img src="assets/images/icons/deadline.svg" alt="critical" style="width:16px;height:16px;vertical-align:middle;margin-right:5px;"> Push through strategically. Minimum distractions, maximum output.',
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
  var arr = strategies[urgency] || strategies.medium;
  return arr[energy <= 3 ? 2 : energy <= 6 ? 1 : 0];
}

/* Energy badge */
function energyBadge(e) {
  if (e <= 3) return '<span class="badge b-red"><img src="assets/images/icons/sleep.svg" alt="low energy" style="width:12px;height:12px;vertical-align:middle;margin-right:3px;"> Low</span>';
  if (e <= 6) return '<span class="badge b-amber"><img src="assets/images/icons/energy.svg" alt="medium energy" style="width:12px;height:12px;vertical-align:middle;margin-right:3px;"> Medium</span>';
  return '<span class="badge b-green"><img src="assets/images/icons/momentum.svg" alt="high energy" style="width:12px;height:12px;vertical-align:middle;margin-right:3px;"> High</span>';
}

/* full pomodoro plan*/
function buildPlan(energy, sleep, time, urgency, subject) {
  var totalMins = Math.round(time * 60);
  var wb = workBlock(energy, sleep);
  var sb = shortBreak(energy, sleep);
  var lb = longBreak(energy, sleep);
  var sm = sleepMod(sleep);

  
  if (totalMins < wb) {
    return { tooShort: true, wb: wb, subject: subject };
  }

  var blocks  = [];
  var elapsed = 0;
  var count   = 0;

  while (elapsed + wb <= totalMins) {
    
    count++;
    blocks.push({ type: 'work', duration: wb, index: count });
    elapsed += wb;

 
    var isLong = (count % 4 === 0);
    var br     = isLong ? lb : sb;

    var breakFits    = (elapsed + br      <= totalMins);
    var nextWorkFits = (elapsed + br + wb <= totalMins);

    if (breakFits && nextWorkFits) {

      blocks.push({ type: 'break', duration: br, index: count, isLong: isLong });
      elapsed += br;
    } else {

      break;
    }
  }

  return {
    energy:     energy,
    sleep:      sleep,
    urgency:    urgency,
    subject:    subject,
    wb:         wb,
    sb:         sb,
    lb:         lb,
    blocks:     blocks,
    count:      count,
    strategy:   getStrategy(urgency, energy),
    /* FIX: sum every block's duration (work + breaks) instead of count * wb only */
    totalStudy: blocks.reduce(function(acc, b) { return acc + b.duration; }, 0),
    sm:         sm
  };
}

/* Handle planner form submit */
function handlePlanner(e) {
  e.preventDefault();
  var energy  = parseInt(document.getElementById('energy').value);
  var sleep   = parseFloat(document.getElementById('sleep').value) || 7;
  var time    = parseFloat(document.getElementById('timeAvail').value) || 2;
  var urgency = document.getElementById('urgency').value;
  var subject = document.getElementById('subject').value.trim() || 'Study Session';

  if (!urgency) { alert('Please select a deadline urgency level.'); return; }
  if (time <= 0) { alert('Please enter a valid amount of time.'); return; }

  renderPlan(buildPlan(energy, sleep, time, urgency, subject));
}

/* Render results into the page */
function renderPlan(p) {

  /* Handle sessions that are too short for any work block */
  if (p.tooShort) {
    document.getElementById('resultsEmpty').style.display   = 'none';
    document.getElementById('resultsContent').style.display = 'block';
    document.getElementById('scheduleWrap').style.display   = 'none';
    document.getElementById('resultsContent').innerHTML =
      '<div style="background:rgba(224,92,92,.12);border:1.5px solid rgba(224,92,92,.25);border-radius:14px;padding:.75rem 1rem;font-size:.85rem;color:#e05c5c;">' +
        '<strong>Not enough time.</strong> Your shortest possible work block is <strong>' + p.wb + ' min</strong>. ' +
        'Please increase your available time to at least ' + p.wb + ' minutes.' +
      '</div>';
    return;
  }

  document.getElementById('resultsEmpty').style.display   = 'none';
  document.getElementById('resultsContent').style.display = 'block';
  document.getElementById('scheduleWrap').style.display   = 'block';

  /* pomo chips */
  var chips = p.blocks.map(function(b) {
    if (b.type === 'work') {
      return '<span class="chip chip-w"><img src="assets/images/icons/clock.svg" alt="work" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"> Pomo ' + b.index + ' · ' + b.duration + 'm</span>';
    } else {
      var icon  = b.isLong ? 'music' : 'water';
      var label = b.isLong ? 'Long'  : 'Short';
      return '<span class="chip chip-b"><img src="assets/images/icons/' + icon + '.svg" alt="break" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"> ' + label + ' break · ' + b.duration + 'm</span>';
    }
  }).join('');

  /* Low sleep warning */
  var warn = '';
  if (p.sleep < 6) {
    warn = '<div style="background:rgba(224,92,92,.12);border:1.5px solid rgba(224,92,92,.25);border-radius:14px;padding:.75rem 1rem;margin-bottom:1.2rem;font-size:.83rem;color:#e05c5c;">'
         + '<strong>Low sleep detected (' + p.sleep + 'h).</strong> All blocks shortened by ' + Math.round((1 - p.sm) * 100) + '% to protect your focus.'
         + '</div>';
  }

  document.getElementById('resultsContent').innerHTML =
    warn +
    '<div class="r-block">' +
      '<div class="r-label">Subject</div>' +
      '<p><strong>' + p.subject + '</strong> ' + energyBadge(p.energy) + '</p>' +
    '</div>' +
    '<div class="r-block">' +
      '<div class="r-label">Today\'s Strategy</div>' +
      '<p>' + p.strategy + '</p>' +
    '</div>' +
    '<div class="r-block">' +
      '<div class="r-label">Summary</div>' +
      '<p>' +
        '<strong>' + p.count + '</strong> Pomodoro' + (p.count !== 1 ? 's' : '') + ' &nbsp;&middot;&nbsp;' +
        /* FIX: show study-only minutes and total session minutes separately */
        '<strong>' + (p.count * p.wb) + ' min</strong> focused study &nbsp;&middot;&nbsp;' +
        '<strong>' + p.totalStudy + ' min</strong> total session &nbsp;&middot;&nbsp;' +
        'Work: <strong>' + p.wb + 'm</strong> &nbsp;&middot;&nbsp;' +
        'Short break: <strong>' + p.sb + 'm</strong> &nbsp;&middot;&nbsp;' +
        'Long break: <strong>' + p.lb + 'm</strong>' +
      '</p>' +
    '</div>' +
    '<div class="r-block">' +
      '<div class="r-label">Your Blocks</div>' +
      '<div class="chips">' + (chips || '<span style="opacity:.6;font-size:.85rem;">No blocks fit — try increasing time available.</span>') + '</div>' +
    '</div>';

  /* Session schedule table — starts from current time */
  var now = new Date();
  now.setSeconds(0, 0);

  function formatTime(d) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function addMinutes(d, m) {
    return new Date(d.getTime() + m * 60000);
  }

  var rows = p.blocks.map(function(b) {
    var start = formatTime(now);
    now = addMinutes(now, b.duration);
    var end = formatTime(now);

    var label;
    if (b.type === 'work') {
      label = '<img src="assets/images/icons/clock.svg" alt="work" style="width:14px;height:14px;vertical-align:middle;margin-right:5px;"> Work Block (Pomo ' + b.index + ')';
    } else if (b.isLong) {
      label = '<img src="assets/images/icons/music.svg" alt="long break" style="width:14px;height:14px;vertical-align:middle;margin-right:5px;"> Long Break';
    } else {
      label = '<img src="assets/images/icons/water.svg" alt="short break" style="width:14px;height:14px;vertical-align:middle;margin-right:5px;"> Short Break';
    }

    var rowStyle = b.type !== 'work' ? ' style="background:var(--green-pale)"' : '';
    var task     = b.type === 'work' ? p.subject : '—';
    return '<tr' + rowStyle + '><td>' + start + ' – ' + end + '</td><td>' + label + '</td><td>' + b.duration + ' min</td><td>' + task + '</td></tr>';
  }).join('');

  var noRows = '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:1.5rem;">No blocks fit — please increase time available.</td></tr>';

  document.getElementById('scheduleTable').innerHTML =
    '<table>' +
      '<thead><tr><th>Time Slot</th><th>Block</th><th>Duration</th><th>Task</th></tr></thead>' +
      '<tbody>' + (rows || noRows) + '</tbody>' +
    '</table>';
}

/* contact form*/
function handleContact(e) {
  e.preventDefault();
  var name    = document.getElementById('fullName').value.trim();
  var email   = document.getElementById('email').value.trim();
  var subject = document.getElementById('subject_c').value;
  var message = document.getElementById('message').value.trim();
  var terms   = document.getElementById('terms').checked;

  if (!name || !email || !subject || !message) {
    alert('Please fill in all required fields.'); return;
  }
  if (!terms) { alert('Please check the agreement checkbox.'); return; }
  if (!email.includes('@')) { alert('Please enter a valid email address.'); return; }

  var subjectLabels = {
    general:  'General Question',
    feedback: 'Feedback about PomoPlan',
    feature:  'Feature Request',
    bug:      'Bug Report',
    other:    'Other'
  };
  var subjectLabel = subjectLabels[subject] || subject;

  var body = 'Name: ' + name + '\nEmail: ' + email + '\nSubject: ' + subjectLabel + '\n\nMessage:\n' + message;
  var mailtoLink = 'mailto:slayersplan@gmail.com?subject=' + encodeURIComponent('[PomoPlan] ' + subjectLabel) + '&body=' + encodeURIComponent(body);
  window.location.href = mailtoLink;

  var ok = document.getElementById('formSuccess');
  ok.style.display = 'block';
  e.target.reset();
  setTimeout(function() { ok.style.display = 'none'; }, 5000);
}