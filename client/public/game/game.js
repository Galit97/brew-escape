/**
 * Barista Rush: Birthday Edition – שלבי הכנת קפה בעברית
 * כל התהליכים להכנת המשקאות (כל שלב תואם לכפתור פעולה):
 * הנחת כוס, טחינת פולים, דחיסה, חליטת אספרסו, חימום חלב,
 * הוספת מים חמים, הוספת חלב, הוספת קצף, הוספת שוקו, הוספת חלב חם,
 * הוספת קרח, פתיחת בקבוק, עירסול יין, לשים בדיקנטר, מזיגת יין, חליטת קולד ברו, הגשה
 */

(function () {
  'use strict';

  const TOTAL_CLIENTS = 10;
  /* סדר נכון: הנחת כוס → טחינת פולים → דחיסה → חליטה → שאר השלבים */
  const DRINKS = {
    'אספרסו': ['הנחת כוס', 'טחינת פולים', 'דחיסה', 'חליטת אספרסו', 'הגשה'],
    'אמריקנו': ['הנחת כוס', 'טחינת פולים', 'דחיסה', 'חליטת אספרסו', 'הוספת מים חמים', 'הגשה'],
    'קפוצ\'ינו': ['הנחת כוס', 'טחינת פולים', 'דחיסה', 'חליטת אספרסו', 'חימום חלב', 'הוספת חלב', 'הוספת קצף', 'הגשה'],
    'לאטה': ['הנחת כוס', 'טחינת פולים', 'דחיסה', 'חליטת אספרסו', 'חימום חלב', 'הוספת חלב', 'הגשה'],
    'שוקו': ['הנחת כוס', 'הוספת שוקו', 'הוספת חלב חם', 'הגשה'],
    'קפה חם': ['הנחת כוס', 'טחינת פולים', 'דחיסה', 'חליטת אספרסו', 'הוספת מים חמים', 'הגשה'],
    'קפה קר': ['הנחת כוס', 'טחינת פולים', 'דחיסה', 'חליטת אספרסו', 'הוספת קרח', 'הגשה'],
    'יין': ['הנחת כוס', 'פתיחת בקבוק', 'עירסול יין', 'לשים בדיקנטר', 'מזיגת יין', 'הגשה'],
    'קולד ברו': ['הנחת כוס', 'טחינת פולים', 'חליטת קולד ברו', 'הוספת קרח', 'הגשה'],
  };
  const DRINK_NAMES = Object.keys(DRINKS);
  const CUSTOMER_AVATARS = ['galit', 'konus', 'bonus'];

  const DIFFICULTY = {
    easy: { patienceMax: 120, drainRate: 1 },   /* קל = 2 דקות */
    normal: { patienceMax: 60, drainRate: 1 },
    hard: { patienceMax: 40, drainRate: 1.4 },
  };

  const SCORE_PER_ORDER = 50;
  const TIP_MIN = 5;
  const TIP_MAX = 20;
  const PATIENCE_PENALTY_WRONG_STEP = 0.05;
  const MAX_REPUTATION = 3;

  const WRONG_HINT = 'עדיין לא!';
  const SERVE_ACTION = 'הגשה';

  let state = 'MENU';
  let difficulty = 'normal';
  let score = 0;
  let tips = 0;
  let reputation = MAX_REPUTATION;
  let clientIndex = 0;
  let queue = [];
  let currentClient = null;
  let currentStepIndex = 0;
  let currentSteps = [];
  let lastTime = 0;
  let rafId = null;
  let clientIdCounter = 0;
  let isPaused = false;

  const screens = {
    menu: document.getElementById('menu-screen'),
    playing: document.getElementById('playing-screen'),
    end: document.getElementById('end-screen'),
  };
  const scoreEl = document.getElementById('score');
  const tipsEl = document.getElementById('tips');
  const heartsEl = document.getElementById('hearts');
  const dayProgressEl = document.getElementById('day-progress');
  const timerDisplayEl = document.getElementById('timer-display');
  const timerDisplayLeftEl = document.getElementById('timer-display-left');
  const queueEl = document.getElementById('queue');
  const currentClientAvatarEl = document.getElementById('current-client-avatar');
  const clientCloudDrinkEl = document.getElementById('client-cloud-drink');
  const patienceBarEl = document.getElementById('patience-bar');
  const patienceTextEl = document.getElementById('patience-text');
  const hintOnlyEl = document.getElementById('hint-only');
  const shakeOverlay = document.getElementById('shake-overlay');
  const actionButtons = document.getElementById('action-buttons');
  const stepProgressTextEl = document.getElementById('step-progress-text');
  const stepIndicatorsEl = document.getElementById('step-indicators');
  const stepProgressWrapEl = document.getElementById('step-progress-wrap');
  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const pauseOverlayEl = document.getElementById('pause-overlay');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const endScoreEl = document.getElementById('end-score');
  const endTipsEl = document.getElementById('end-tips');
  const endHeartsEl = document.getElementById('end-hearts');
  const confettiEl = document.getElementById('confetti');
  const currentClientCard = document.getElementById('current-client');

  function setScreen(name) {
    state = name;
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle('active', key === name.toLowerCase());
    });
  }

  function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function shuffleActionButtons() {
    if (!actionButtons) return;
    const buttons = Array.from(actionButtons.querySelectorAll('.action-btn'));
    const shuffled = shuffleArray(buttons);
    shuffled.forEach(function (btn) {
      actionButtons.appendChild(btn);
    });
  }

  function createClient() {
    clientIdCounter += 1;
    const drinkType = randomChoice(DRINK_NAMES);
    const cfg = DIFFICULTY[difficulty];
    const avatar = randomChoice(CUSTOMER_AVATARS);
    return {
      id: clientIdCounter,
      drinkType: drinkType,
      avatar: avatar,
      patienceMax: cfg.patienceMax,
      patienceLeft: cfg.patienceMax,
    };
  }

  function formatTimer(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function updateTimerDisplay() {
    const t = currentClient ? formatTimer(currentClient.patienceLeft) : '0:00';
    if (timerDisplayEl) timerDisplayEl.textContent = t;
    if (timerDisplayLeftEl) timerDisplayLeftEl.textContent = t;
  }

  function updatePatienceBar() {
    if (!currentClient) {
      updateTimerDisplay();
      return;
    }
    const pct = Math.max(0, currentClient.patienceLeft / currentClient.patienceMax);
    patienceBarEl.style.width = (pct * 100) + '%';
    patienceBarEl.classList.remove('warning', 'danger');
    if (pct <= 0.33) patienceBarEl.classList.add('danger');
    else if (pct <= 0.66) patienceBarEl.classList.add('warning');
    patienceTextEl.textContent = Math.ceil(currentClient.patienceLeft) + ' ש׳';
    updateTimerDisplay();
  }

  function renderQueue() {
    const slots = queueEl.querySelectorAll('.queue-slot');
    slots.forEach(function (slot, i) {
      slot.classList.remove('filled');
      slot.innerHTML = '';
      if (queue[i]) {
        slot.classList.add('filled');
        const img = document.createElement('img');
        img.className = 'queue-avatar';
        img.src = 'assets/images/' + queue[i].avatar + '.png';
        img.alt = '';
        slot.appendChild(img);
      } else {
        slot.textContent = '—';
      }
    });
  }

  function updateCurrentClientDisplay() {
    if (!currentClient) {
      if (currentClientAvatarEl) {
        currentClientAvatarEl.src = '';
        currentClientAvatarEl.alt = '';
      }
      if (clientCloudDrinkEl) clientCloudDrinkEl.textContent = '—';
      updateStepProgress();
      return;
    }
    if (currentClientAvatarEl) {
      currentClientAvatarEl.src = 'assets/images/' + currentClient.avatar + '.png';
      currentClientAvatarEl.alt = '';
    }
    if (clientCloudDrinkEl) clientCloudDrinkEl.textContent = currentClient.drinkType;
    updateStepProgress();
  }

  function updateStepProgress() {
    if (!stepProgressTextEl || !stepIndicatorsEl || !stepProgressWrapEl) return;
    if (!currentClient || !currentSteps.length) {
      stepProgressWrapEl.classList.add('hidden');
      stepProgressTextEl.textContent = '0 מתוך 0';
      stepIndicatorsEl.innerHTML = '';
      return;
    }
    stepProgressWrapEl.classList.remove('hidden');
    const total = currentSteps.length;
    const done = currentStepIndex;
    stepProgressTextEl.textContent = done + ' מתוך ' + total + ' תהליכים';
    stepIndicatorsEl.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const span = document.createElement('span');
      span.className = 'step-dot';
      if (i < done) {
        span.classList.add('done');
        span.textContent = '✓';
      } else {
        span.textContent = '○';
      }
      stepIndicatorsEl.appendChild(span);
    }
  }

  function flashLastCheck() {
    if (!stepIndicatorsEl) return;
    const dots = stepIndicatorsEl.querySelectorAll('.step-dot.done');
    if (dots.length) {
      const last = dots[dots.length - 1];
      last.classList.add('just-done');
      setTimeout(function () { last.classList.remove('just-done'); }, 500);
    }
  }

  function updateTopBar() {
    scoreEl.textContent = score;
    tipsEl.textContent = tips;
    heartsEl.textContent = '❤️'.repeat(reputation) + '🖤'.repeat(MAX_REPUTATION - reputation);
    dayProgressEl.textContent = clientIndex + ' / ' + TOTAL_CLIENTS;
  }

  function showWrongStep() {
    if (hintOnlyEl) hintOnlyEl.textContent = WRONG_HINT;
    shakeOverlay.classList.remove('hidden');
    shakeOverlay.classList.add('shake');
    const inner = shakeOverlay.querySelector('.wrong-hint');
    if (inner) inner.textContent = WRONG_HINT;
    setTimeout(function () {
      shakeOverlay.classList.add('hidden');
      shakeOverlay.classList.remove('shake');
      if (hintOnlyEl) hintOnlyEl.textContent = '';
    }, 600);
    if (currentClient) {
      currentClient.patienceLeft = Math.max(0, currentClient.patienceLeft - currentClient.patienceMax * PATIENCE_PENALTY_WRONG_STEP);
      updatePatienceBar();
    }
  }

  function serveEnabled() {
    return currentClient && currentStepIndex === currentSteps.length - 1 && currentSteps[currentSteps.length - 1] === SERVE_ACTION;
  }

  function updateServeButton() {
    const serveBtn = actionButtons.querySelector('[data-action="' + SERVE_ACTION + '"]');
    if (serveBtn) serveBtn.disabled = !serveEnabled();
  }

  function finishOrder(success) {
    if (success) {
      score += SCORE_PER_ORDER;
      tips += randomInt(TIP_MIN, TIP_MAX);
      currentClientCard.classList.add('success-flash');
      setTimeout(function () { currentClientCard.classList.remove('success-flash'); }, 600);
    } else {
      reputation = Math.max(0, reputation - 1);
    }
    currentClient = null;
    currentStepIndex = 0;
    currentSteps = [];
    clientIndex += 1;
    updateTopBar();
    updateCurrentClientDisplay();
    updatePatienceBar();
    updateServeButton();
    if (clientIndex >= TOTAL_CLIENTS) {
      endDay();
      return;
    }
    advanceQueue();
  }

  function endDay() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    setScreen('end');
    endScoreEl.textContent = score;
    endTipsEl.textContent = tips;
    endHeartsEl.textContent = '❤️'.repeat(reputation) + '🖤'.repeat(MAX_REPUTATION - reputation);
    spawnConfetti();
  }

  function spawnConfetti() {
    confettiEl.innerHTML = '';
    const colors = ['#c4a77d', '#8b7355', '#5a9a5a', '#e8b84a', '#c45c5c', '#8b5cf6'];
    for (let i = 0; i < 60; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = randomChoice(colors);
      piece.style.animationDelay = (Math.random() * 0.8) + 's';
      piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
      confettiEl.appendChild(piece);
    }
  }

  function advanceQueue() {
    while (queue.length < 3 && clientIndex + queue.length < TOTAL_CLIENTS) {
      queue.push(createClient());
    }
    renderQueue();
    if (queue.length === 0) {
      endDay();
      return;
    }
    currentClient = queue.shift();
    currentSteps = DRINKS[currentClient.drinkType].slice();
    currentStepIndex = 0;
    /* כפתורי פעולות נשארים בסדר קבוע (לפי סדר הפעולות) – בלי ערבוב */
    updateCurrentClientDisplay();
    updatePatienceBar();
    updateServeButton();
    lastTime = performance.now();
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (isPaused) {
      lastTime = now;
      return;
    }
    if (!currentClient) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    currentClient.patienceLeft = Math.max(0, currentClient.patienceLeft - dt * DIFFICULTY[difficulty].drainRate);
    updatePatienceBar();
    if (currentClient.patienceLeft <= 0) {
      finishOrder(false);
    }
  }

  function togglePause() {
    isPaused = !isPaused;
    if (btnPause) {
      btnPause.textContent = isPaused ? '▶ המשך' : '⏸ השהה';
      btnPause.classList.toggle('paused', isPaused);
    }
    if (pauseOverlayEl) pauseOverlayEl.classList.toggle('hidden', !isPaused);
  }

  function onActionClick(action) {
    if (!currentClient) return;
    const expected = currentSteps[currentStepIndex];
    if (action !== expected) {
      showWrongStep();
      return;
    }
    currentStepIndex += 1;
    updateStepProgress();
    flashLastCheck();
    updateServeButton();
    if (hintOnlyEl) hintOnlyEl.textContent = '';
    if (action === SERVE_ACTION) {
      finishOrder(true);
    }
  }

  document.querySelectorAll('.difficulty-row button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sel = document.querySelector('.difficulty-row button.selected');
      if (sel) sel.classList.remove('selected');
      btn.classList.add('selected');
      difficulty = btn.getAttribute('data-difficulty');
    });
  });

  btnStart.addEventListener('click', function () {
    score = 0;
    tips = 0;
    reputation = MAX_REPUTATION;
    clientIndex = 0;
    queue = [];
    currentClient = null;
    currentStepIndex = 0;
    currentSteps = [];
    clientIdCounter = 0;
    isPaused = false;
    if (btnPause) {
      btnPause.textContent = '⏸ השהה';
      btnPause.classList.remove('paused');
    }
    if (pauseOverlayEl) pauseOverlayEl.classList.add('hidden');
    setScreen('playing');
    updateTopBar();
    advanceQueue();
  });

  if (btnPause) btnPause.addEventListener('click', togglePause);
  if (pauseOverlayEl) pauseOverlayEl.addEventListener('click', togglePause);

  btnPlayAgain.addEventListener('click', function () {
    setScreen('menu');
  });

  actionButtons.addEventListener('click', function (e) {
    const btn = e.target.closest('.action-btn');
    if (!btn || btn.disabled) return;
    const action = btn.getAttribute('data-action');
    if (action) onActionClick(action);
  });

  setScreen('menu');
})();
