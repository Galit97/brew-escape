/**
 * Barista Rush: Birthday Edition
 * Pure vanilla HTML/CSS/JS - single page, no external libs.
 * States: MENU → PLAYING → END
 */

(function () {
  'use strict';

  // --- Constants ---
  const TOTAL_CLIENTS = 10;
  const DRINKS = {
    Espresso: ['Place Cup', 'Grind Beans', 'Tamp', 'Pull Shot', 'Serve'],
    Americano: ['Place Cup', 'Pull Shot', 'Add Hot Water', 'Serve'],
    Cappuccino: ['Place Cup', 'Pull Shot', 'Steam Milk', 'Add Milk', 'Add Foam', 'Serve'],
    Latte: ['Place Cup', 'Pull Shot', 'Steam Milk', 'Add Milk', 'Serve'],
  };
  const DRINK_NAMES = Object.keys(DRINKS);

  const DIFFICULTY = {
    easy: { patienceMax: 35, drainRate: 1 },
    normal: { patienceMax: 25, drainRate: 1 },
    hard: { patienceMax: 20, drainRate: 1.4 },
  };

  const SCORE_PER_ORDER = 50;
  const TIP_MIN = 5;
  const TIP_MAX = 20;
  const PATIENCE_PENALTY_WRONG_STEP = 0.05; // 5% of max
  const MAX_REPUTATION = 3;

  // --- State ---
  let state = 'MENU'; // MENU | PLAYING | END
  let difficulty = 'normal';
  let score = 0;
  let tips = 0;
  let reputation = MAX_REPUTATION;
  let clientIndex = 0;
  let queue = [];
  let currentClient = null;
  let currentStepIndex = 0;
  let currentSteps = [];
  let patienceLeft = 0;
  let patienceMax = 25;
  let drainRate = 1;
  let lastTime = 0;
  let rafId = null;
  let clientIdCounter = 0;

  // --- DOM refs ---
  const screens = {
    menu: document.getElementById('menu-screen'),
    playing: document.getElementById('playing-screen'),
    end: document.getElementById('end-screen'),
  };
  const scoreEl = document.getElementById('score');
  const tipsEl = document.getElementById('tips');
  const heartsEl = document.getElementById('hearts');
  const dayProgressEl = document.getElementById('day-progress');
  const queueEl = document.getElementById('queue');
  const currentClientCard = document.getElementById('current-client');
  const clientMoodEl = document.getElementById('client-mood');
  const clientOrderNameEl = document.getElementById('client-order-name');
  const patienceBarEl = document.getElementById('patience-bar');
  const patienceTextEl = document.getElementById('patience-text');
  const orderDrinkNameEl = document.getElementById('order-drink-name');
  const orderChecklistEl = document.getElementById('order-checklist');
  const hintEl = document.getElementById('hint');
  const shakeOverlay = document.getElementById('shake-overlay');
  const actionButtons = document.getElementById('action-buttons');
  const btnStart = document.getElementById('btn-start');
  const btnPlayAgain = document.getElementById('btn-play-again');
  const endScoreEl = document.getElementById('end-score');
  const endTipsEl = document.getElementById('end-tips');
  const endHeartsEl = document.getElementById('end-hearts');
  const confettiEl = document.getElementById('confetti');

  // --- Helpers ---
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

  function createClient() {
    clientIdCounter += 1;
    const drinkType = randomChoice(DRINK_NAMES);
    const cfg = DIFFICULTY[difficulty];
    const maxP = cfg.patienceMax;
    return {
      id: clientIdCounter,
      drinkType: drinkType,
      patienceMax: maxP,
      patienceLeft: maxP,
      moodState: 'happy',
    };
  }

  function getMoodEmoji(percent) {
    if (percent > 0.66) return '🙂';
    if (percent > 0.33) return '😐';
    return '😠';
  }

  function updatePatienceBar() {
    if (!currentClient) return;
    const pct = Math.max(0, currentClient.patienceLeft / currentClient.patienceMax);
    patienceBarEl.style.width = (pct * 100) + '%';
    patienceBarEl.classList.remove('warning', 'danger');
    if (pct <= 0.33) patienceBarEl.classList.add('danger');
    else if (pct <= 0.66) patienceBarEl.classList.add('warning');
    patienceTextEl.textContent = Math.ceil(currentClient.patienceLeft) + 's left';
    clientMoodEl.textContent = getMoodEmoji(pct);
  }

  function renderQueue() {
    const slots = queueEl.querySelectorAll('.queue-slot');
    slots.forEach(function (slot, i) {
      slot.classList.remove('filled');
      slot.textContent = '';
      if (queue[i]) {
        slot.classList.add('filled');
        slot.textContent = queue[i].drinkType;
      } else {
        slot.textContent = '—';
      }
    });
  }

  function renderOrderCard() {
    orderDrinkNameEl.textContent = currentClient ? currentClient.drinkType : '—';
    orderChecklistEl.innerHTML = '';
    if (!currentClient) return;
    const steps = DRINKS[currentClient.drinkType];
    steps.forEach(function (step, i) {
      const li = document.createElement('li');
      li.textContent = step;
      if (i < currentStepIndex) li.classList.add('done');
      orderChecklistEl.appendChild(li);
    });
  }

  function updateTopBar() {
    scoreEl.textContent = score;
    tipsEl.textContent = tips;
    heartsEl.textContent = '❤️'.repeat(reputation) + '🖤'.repeat(MAX_REPUTATION - reputation);
    dayProgressEl.textContent = clientIndex + ' / ' + TOTAL_CLIENTS;
  }

  function showWrongStep() {
    hintEl.textContent = 'Not yet!';
    shakeOverlay.classList.remove('hidden');
    shakeOverlay.classList.add('shake');
    const inner = shakeOverlay.querySelector('.wrong-hint');
    if (inner) inner.textContent = 'Not yet!';
    setTimeout(function () {
      shakeOverlay.classList.add('hidden');
      shakeOverlay.classList.remove('shake');
      hintEl.textContent = '';
    }, 600);
    // Reduce patience slightly
    if (currentClient) {
      currentClient.patienceLeft = Math.max(0, currentClient.patienceLeft - currentClient.patienceMax * PATIENCE_PENALTY_WRONG_STEP);
      updatePatienceBar();
    }
  }

  function serveEnabled() {
    return currentClient && currentStepIndex === currentSteps.length - 1 && currentSteps[currentSteps.length - 1] === 'Serve';
  }

  function updateServeButton() {
    const serveBtn = actionButtons.querySelector('[data-action="Serve"]');
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
    renderOrderCard();
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
    // Refill queue up to 3
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
    patienceLeft = currentClient.patienceLeft;
    patienceMax = currentClient.patienceMax;
    drainRate = DIFFICULTY[difficulty].drainRate;
    clientOrderNameEl.textContent = currentClient.drinkType;
    renderOrderCard();
    updatePatienceBar();
    updateServeButton();
    lastTime = performance.now();
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (!currentClient) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    currentClient.patienceLeft = Math.max(0, currentClient.patienceLeft - dt * drainRate);
    updatePatienceBar();
    if (currentClient.patienceLeft <= 0) {
      finishOrder(false);
    }
  }

  function onActionClick(action) {
    if (!currentClient) return;
    const expected = currentSteps[currentStepIndex];
    if (action !== expected) {
      showWrongStep();
      return;
    }
    currentStepIndex += 1;
    renderOrderCard();
    updateServeButton();
    hintEl.textContent = '';
    if (action === 'Serve') {
      finishOrder(true);
    }
  }

  // --- Event listeners ---
  document.querySelectorAll('.difficulty-buttons button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelector('.difficulty-buttons button.selected').classList.remove('selected');
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
    setScreen('playing');
    updateTopBar();
    advanceQueue();
  });

  btnPlayAgain.addEventListener('click', function () {
    setScreen('menu');
  });

  actionButtons.addEventListener('click', function (e) {
    const btn = e.target.closest('.action-btn');
    if (!btn || btn.disabled) return;
    const action = btn.getAttribute('data-action');
    if (action) onActionClick(action);
  });

  // Initial UI
  setScreen('menu');
})();
