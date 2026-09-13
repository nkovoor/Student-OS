import { el } from './dom.js';
import { AppState } from './state.js';
import { renderActivities } from './tabs/activities.js';
import { renderAvailability } from './tabs/availability.js';

// Only the two tabs built so far (spec §11 Activities + Availability). The
// nav is data-driven so Home/Scheduler/Progress are a one-line addition each
// once they exist — nothing here assumes exactly two tabs.
const TABS = [
  { id: 'activities', label: 'Activities', render: renderActivities },
  { id: 'availability', label: 'Availability', render: renderAvailability },
];

const state = new AppState();
let activeTabId = TABS[0].id;

function renderHeader() {
  const dateEl = document.getElementById('header-date');
  const greetEl = document.getElementById('header-greeting');
  const now = new Date();

  dateEl.textContent = now
    .toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    .toUpperCase();

  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  greetEl.textContent = `Good ${timeOfDay}. Here's what's on your plate.`;
}

function renderTabNav() {
  const nav = document.getElementById('tab-nav');
  nav.replaceChildren();

  TABS.forEach((tab) => {
    nav.append(
      el('button', {
        type: 'button',
        role: 'tab',
        class: 'tab-btn' + (tab.id === activeTabId ? ' is-active' : ''),
        'aria-selected': String(tab.id === activeTabId),
        text: tab.label,
        onClick: () => {
          if (tab.id === activeTabId) return;
          activeTabId = tab.id;
          renderTabNav();
          renderActiveTab();
        },
      })
    );
  });
}

function renderActiveTab() {
  const main = document.getElementById('main-content');
  const tab = TABS.find((t) => t.id === activeTabId);
  tab.render(main, state);

  // Restart the entrance animation on every tab switch / state change
  // (spec §9: applied uniformly on every render).
  main.classList.remove('fade-in');
  void main.offsetWidth;
  main.classList.add('fade-in');
}

state.subscribe(() => renderActiveTab());

renderHeader();
renderTabNav();
renderActiveTab();
