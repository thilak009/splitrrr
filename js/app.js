import { renderHome } from './screens/home.js';
import { renderCapture } from './screens/capture.js';
import { renderReview } from './screens/review.js';
import { renderParticipants } from './screens/participants.js';
import { renderAssign, teardownAssign } from './screens/assign.js';
import { renderSummary } from './screens/summary.js';
import { makeId } from './components/chip.js';
import { saveDraft, loadDraft, clearDraft, getBill, setViewing, getViewing } from './storage.js';
import { confirmModal } from './components/modal.js';
import { BILL_CHANGED } from './events.js';
import { round2 } from './calc.js';

const SCREENS = ['home', 'capture', 'review', 'participants', 'assign', 'summary'];
const RESTORABLE_SCREENS = new Set(['review', 'participants', 'assign', 'summary']);

const state = {
  currentBill: null,
  screenStack: ['home'],
  currentScreen: 'home',
};

let persistTimer = null;
function persistDraft() {
  if (!state.currentBill || state.viewOnly || !RESTORABLE_SCREENS.has(state.currentScreen)) {
    if (!state.viewOnly) clearDraft();
    return;
  }
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    saveDraft({
      bill: state.currentBill,
      screen: state.currentScreen,
      screenStack: state.screenStack,
    });
  }, 400);
}

function newBill() {
  return {
    id: makeId('b'),
    name: '',
    createdAt: Date.now(),
    items: [],
    participants: [],
    assignments: {},
    extras: { serviceCharge: 0, tax: 0, tip: 0, discount: 0 },
    totals: null,
  };
}

function showScreen(name) {
  for (const s of SCREENS) {
    const el = document.getElementById('screen-' + s);
    if (el) el.hidden = (s !== name);
  }
  const back = document.getElementById('back-btn');
  back.hidden = (name === 'home');
  window.scrollTo(0, 0);
}

function navigate(name, { push = true } = {}) {
  if (name !== 'assign') teardownAssign();
  showScreen(name);
  if (push) {
    state.screenStack.push(name);
    history.pushState({ screen: name }, '', '#' + name);
  }
  state.currentScreen = name;
  mountScreen(name);
  persistDraft();
}

function goBack() {
  if (state.screenStack.length <= 1) return;
  history.back();
}

function mountScreen(name) {
  switch (name) {
    case 'home':
      state.currentBill = null;
      state.viewOnly = false;
      clearDraft();
      setViewing(null);
      renderHome({
        onNewBill: () => {
          state.currentBill = newBill();
          state.viewOnly = false;
          navigate('capture');
        },
        onOpenBill: (id) => {
          const b = getBill(id);
          if (!b) return;
          state.currentBill = b;
          state.viewOnly = true;
          setViewing(id);
          navigate('summary');
        },
      });
      break;

    case 'capture':
      if (!state.currentBill) state.currentBill = newBill();
      renderCapture({
        onParsed: ({ parsed }) => {
          state.currentBill.items = parsed.items;
          state.currentBill.extras = {
            serviceCharge: round2(parsed.serviceCharge),
            tax: round2(parsed.tax),
            tip: round2(parsed.tip),
            discount: round2(parsed.discount),
          };
          navigate('review');
        },
        onSkip: () => navigate('review'),
      });
      break;

    case 'review':
      if (!state.currentBill) { navigate('home', { push: false }); return; }
      renderReview({
        bill: state.currentBill,
        onNext: () => navigate('participants'),
      });
      break;

    case 'participants':
      if (!state.currentBill) { navigate('home', { push: false }); return; }
      renderParticipants({
        bill: state.currentBill,
        onNext: () => navigate('assign'),
      });
      break;

    case 'assign':
      if (!state.currentBill) { navigate('home', { push: false }); return; }
      renderAssign({
        bill: state.currentBill,
        onNext: () => navigate('summary'),
      });
      break;

    case 'summary':
      if (!state.currentBill) { navigate('home', { push: false }); return; }
      renderSummary({
        bill: state.currentBill,
        viewOnly: state.viewOnly === true,
        onSaved: () => {
          state.screenStack = ['home'];
          history.replaceState({ screen: 'home' }, '', '#home');
          navigate('home', { push: false });
        },
        onDiscard: async () => {
          const ok = await confirmModal('Discard this bill without saving?', { confirmLabel: 'Discard' });
          if (!ok) return;
          state.screenStack = ['home'];
          history.replaceState({ screen: 'home' }, '', '#home');
          navigate('home', { push: false });
        },
        onDone: () => {
          state.screenStack = ['home'];
          history.replaceState({ screen: 'home' }, '', '#home');
          navigate('home', { push: false });
        },
      });
      break;
  }
}

document.getElementById('back-btn').addEventListener('click', goBack);

window.addEventListener('popstate', (e) => {
  const name = e.state?.screen || 'home';
  state.screenStack.pop();
  if (name !== 'assign') teardownAssign();
  state.currentScreen = name;
  showScreen(name);
  mountScreen(name);
  persistDraft();
});

document.addEventListener('input', () => persistDraft());
document.addEventListener('change', () => persistDraft());
document.addEventListener(BILL_CHANGED, () => persistDraft());

const draft = loadDraft();
const viewingId = getViewing();
if (draft && draft.bill && RESTORABLE_SCREENS.has(draft.screen)) {
  state.currentBill = draft.bill;
  state.screenStack = Array.isArray(draft.screenStack) && draft.screenStack.length
    ? draft.screenStack
    : ['home', draft.screen];
  state.currentScreen = draft.screen;
  history.replaceState({ screen: draft.screen }, '', '#' + draft.screen);
  showScreen(draft.screen);
  mountScreen(draft.screen);
} else if (viewingId) {
  const b = getBill(viewingId);
  if (b) {
    state.currentBill = b;
    state.viewOnly = true;
    state.screenStack = ['home', 'summary'];
    state.currentScreen = 'summary';
    history.replaceState({ screen: 'summary' }, '', '#summary');
    showScreen('summary');
    mountScreen('summary');
  } else {
    setViewing(null);
    bootHome();
  }
} else {
  bootHome();
}

function bootHome() {
  state.screenStack = ['home'];
  state.currentScreen = 'home';
  history.replaceState({ screen: 'home' }, '', '#home');
  showScreen('home');
  mountScreen('home');
}
