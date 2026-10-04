let vehicles = [
  { id: 'AP39AB1234', owner: 'krian', model: 'Tata Nexon EV', battery: 64, capacity: 40.5, connector: 'CCS2', sessions: 24, last: 'Today 14:08', status: 'Charging' },
  { id: 'AP40CD5678', owner: 'sandhya', model: 'MG ZS EV', battery: 15, capacity: 50.3, connector: 'CCS2', sessions: 18, last: 'Yesterday 18:22', status: 'Queued' },
  { id: 'MH12AB5678', owner: 'gowtham', model: 'Hyundai Ioniq 5', battery: 41, capacity: 72.6, connector: 'CCS2', sessions: 31, last: 'Today 14:24', status: 'Charging' },
  { id: 'KA01CD9012', owner: 'kishore', model: 'Kia EV6', battery: 77, capacity: 77.4, connector: 'Type 2', sessions: 12, last: 'Today 13:50', status: 'Charging' },
  { id: 'DL3CAA2341', owner: 'jack devarakonda', model: 'Ola S1 Pro', battery: 55, capacity: 3.97, connector: 'CCS2', sessions: 45, last: 'Today 14:15', status: 'Charging' },
  { id: 'MH14GH3456', owner: 'sneha', model: 'Nexon EV Max', battery: 19, capacity: 40.5, connector: 'Type 2', sessions: 9, last: '2 days ago', status: 'Queued' },
];
let queue = [
  { id: 'AP39AB1234', owner: 'kiran', battery: 8, requested: 35, waiting: 4, arrival: '14:32' },
  { id: 'AP40CD5678', owner: 'sandy', battery: 15, requested: 40, waiting: 8, arrival: '14:28' },
  { id: 'AP39EF9012', owner: 'gowtham', battery: 42, requested: 25, waiting: 12, arrival: '14:24' },
  { id: 'MH14GH3456', owner: 'kishore', battery: 19, requested: 30, waiting: 15, arrival: '14:21' },
  { id: 'KA05IJ7890', owner: 'jack devarakonda', battery: 63, requested: 20, waiting: 19, arrival: '14:17' },
  { id: 'TN09KL2345', owner: 'burito', battery: 28, requested: 45, waiting: 23, arrival: '14:13' },
  { id: 'AP39NV2007', owner:'Kasyap', battery:2, requested:20, waiting:30, arrival:'16:22'},

];
let chargers = [
  { id: 'CH-01', type: 'CCS2', status: 'Available' },
  { id: 'CH-02', type: 'CCS2', status: 'Charging', vehicle: 'AP39AB1234', power: 92, minutes: 34, battery: 64 },
  { id: 'CH-03', type: 'Type 2', status: 'Maintenance' },
  { id: 'CH-04', type: 'CCS2', status: 'Charging', vehicle: 'MH12AB5678', power: 118, minutes: 18, battery: 41 },
  { id: 'CH-05', type: 'Type 2', status: 'Charging', vehicle: 'KA01CD9012', power: 19, minutes: 52, battery: 77 },
  { id: 'CH-06', type: 'CHAdeMO', status: 'Available' },
  { id: 'CH-07', type: 'CCS2', status: 'Available' },
  { id: 'CH-08', type: 'Type 2', status: 'Offline' }
];
let history = [
  { id: 'SES-1047', date: 'Sep 24, 2026', vehicle: 'AP39AB1234', charger: 'CH-04', start: '11:02', end: '12:44', energy: 52.3, duration: '1h 42m', status: 'Completed' },
  { id: 'SES-1046', date: 'Sep 24, 2026', vehicle: 'KA05IJ7890', charger: 'CH-01', start: '09:15', end: '10:08', energy: 28.7, duration: '53m', status: 'Completed' },
  { id: 'SES-1045', date: 'Sep 24, 2026', vehicle: 'TN09KL2345', charger: 'CH-11', start: '08:00', end: '09:12', energy: 67.4, duration: '1h 12m', status: 'Completed' },
  { id: 'SES-1044', date: 'Sep 23, 2026', vehicle: 'MH12AB5678', charger: 'CH-02', start: '19:30', end: '21:05', energy: 89.2, duration: '1h 35m', status: 'Completed' },
  { id: 'SES-1043', date: 'Sep 23, 2026', vehicle: 'DL3CAA2341', charger: 'CH-07', start: '17:44', end: '18:22', energy: 3.1, duration: '38m', status: 'Stopped' },
  { id: 'SES-1042', date: 'Sep 23, 2026', vehicle: 'AP40CD5678', charger: 'CH-03', start: '16:12', end: '17:26', energy: 41.8, duration: '1h 14m', status: 'Completed' },
  { id: 'SES-1041', date: 'Sep 22, 2026', vehicle: 'GJ01MN6789', charger: 'CH-05', start: '14:02', end: '15:31', energy: 57.6, duration: '1h 29m', status: 'Completed' },
  { id: 'SES-1040', date: 'Sep 22, 2026', vehicle: 'KA01CD9012', charger: 'CH-06', start: '10:45', end: '11:52', energy: 34.5, duration: '1h 07m', status: 'Completed' }
];

const root = document.getElementById('view-root');
const API_BASE = location.port === '5500' ? 'http://127.0.0.1:3000/api' : '/api';
async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { 'content-type': 'application/json' }, ...options });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The server could not complete that request.');
  return result;
}
async function refreshData() {
  const state = await api('/state');
  vehicles.splice(0, vehicles.length, ...state.vehicles);
  queue.splice(0, queue.length, ...state.queue);
  chargers.splice(0, chargers.length, ...state.chargers);
  history.splice(0, history.length, ...state.history);
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const priority = battery => battery <= 10 ? 'Emergency' : battery <= 20 ? 'High' : 'Normal';
const safeClass = value => value.toLowerCase().replaceAll(' ', '-');
const pill = value => `<span class="pill ${safeClass(value)}">${escapeHtml(value)}</span>`;
let view = location.hash.slice(1) || 'dashboard';
let historyPage = 1;
let toastTimer;

function stat(label, value, note = '', color = '') {
  return `<article class="stat-card"><div class="stat-label">${label}</div><div class="stat-value ${color}">${value}</div>${note ? `<div class="stat-note">${note}</div>` : ''}</article>`;
}
function heading(title, description, actions = '') {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ''}</div>`;
}
function batteryBar(value) {
  const level = value <= 10 ? 'low' : value <= 20 ? 'mid' : '';
  return `<div class="battery-cell"><span class="battery-mini ${level}"><span style="width:${value}%"></span></span><span class="${level === 'low' ? 'danger' : level === 'mid' ? 'warning' : ''}">${value}%</span></div>`;
}
function chargerCard(charger) {
  const modifier = charger.status === 'Charging' ? 'is-charging' : charger.status === 'Maintenance' ? 'is-maintenance' : charger.status === 'Offline' ? 'is-offline' : '';
  return `<article class="charger-card ${modifier}"><div class="charger-id">${charger.id}</div><div class="charger-type">${charger.type}</div><div class="status-line status-${safeClass(charger.status)}"><i class="dot"></i>${charger.status}</div>${charger.vehicle ? `<div class="charger-vehicle">${charger.vehicle}</div><div class="progress-row"><div class="progress-track"><span style="width:${charger.battery}%"></span></div><b>${charger.battery}% / ${charger.target}%</b></div><div class="subtext">${charger.power} kW · ${charger.minutes} min</div><button class="button button-secondary button-small" data-stop="${charger.id}">Stop charging</button>` : ''}</article>`;
}
function renderDashboard() {
  const available = chargers.filter(charger => charger.status === 'Available').length;
  const charging = chargers.filter(charger => charger.status === 'Charging').length;
  const emergencies = queue.filter(item => priority(item.battery) === 'Emergency').length;
  const high = queue.filter(item => priority(item.battery) === 'High').length;
  const actions = '<button class="button button-secondary" data-action="recalculate">↻ &nbsp;Recalculate Queue</button><button class="button button-primary" data-action="add-vehicle">＋ &nbsp;Add Car</button>';
  return `${heading('Good morning, Admin', "Here's what's happening across your charging network.", actions)}
    <section class="stat-grid">${stat('Total chargers', chargers.length, `<span class="good">${available} Available</span> · ${charging} Occupied · 1 Maint.`)}${stat('Active sessions', charging, '+8.4% today', 'good')}${stat('Waiting vehicles', queue.length, `<span class="danger">${emergencies} emergency</span> · ${high} high priority`)}${stat("Today's energy", '428 kWh', '+12.6% vs yesterday', 'good')}</section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-title"><h2>Live Charger Status</h2><button class="button button-secondary button-small" data-action="manage-chargers">Manage chargers</button></div><div class="charger-grid">${chargers.map(chargerCard).join('')}</div></section>
    <section class="panel queue-preview-panel"><div class="panel-title"><h2>Queue Overview</h2><button class="text-link" data-navigate="queue">Manage →</button></div><div class="queue-preview">${queue.slice(0, 5).map((item, index) => `<div class="queue-preview-row"><span class="rank ${safeClass(priority(item.battery))}">${index + 1}</span><div><div class="vehicle-id">${item.id}</div><div class="subtext">${item.battery}% · ${item.waiting}m wait</div></div>${pill(priority(item.battery))}<button class="assign-link" data-assign="${item.id}">Assign</button></div>`).join('')}</div></section></div>`;
}
function renderQueue() {
  const actions = '<button class="button button-dark" data-action="recalculate">↻ &nbsp;Recalculate Queue</button>';
  const highPriority = queue.filter(item => priority(item.battery) !== 'Normal').length;
  const available = chargers.filter(charger => charger.status === 'Available').length;
  return `${heading('Charging Queue', 'Manage vehicles waiting for available chargers.', actions)}
    <section class="stat-grid">${stat('Queue size', queue.length)}${stat('High priority', highPriority, '', 'warning')}${stat('Available chargers', available, '', 'good')}${stat('Avg wait', `${queue.length ? Math.round(queue.reduce((total, item) => total + item.waiting, 0) / queue.length) : 0} min`)}</section>
    <div class="rule-strip"><span class="rule-title">♧ &nbsp;Priority Rules (Min-Heap)</span><span class="rule-item"><i class="dot" style="color:var(--red)"></i><b> ̰cy</b> — Battery ≤ 10%</span><span class="rule-item"><i class="dot" style="color:var(--amber)"></i><b>High</b> — Battery 11–20%</span><span class="rule-item"><i class="dot" style="color:#98a4b0"></i><b>Normal</b> — Battery &gt; 20%</span><span class="rule-item"><i class="dot" style="color:#5d9df2"></i>Waiting time increases priority after <b>15 min</b></span></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Vehicle ID</th><th>Owner</th><th>Battery</th><th>Target charge</th><th>Priority</th><th>Waiting / estimate</th><th>Arrival</th><th>Action</th></tr></thead><tbody>${queue.map((item, index) => `<tr class="${priority(item.battery) === 'Emergency' ? 'urgent-row' : ''}"><td><span class="rank ${safeClass(priority(item.battery))}">${index + 1}</span></td><td class="mono">${item.id}</td><td>${escapeHtml(item.owner)}</td><td>${batteryBar(item.battery)}</td><td>${item.target || 80}%</td><td>${pill(priority(item.battery))}</td><td>${item.waiting} min waited<br><span class="subtext">Est. ${index * 6} min</span></td><td class="mono">${item.arrival}</td><td><button class="button button-primary button-small" data-assign="${item.id}">Assign Charger</button></td></tr>`).join('')}</tbody></table></div>`;
}
function renderVehicles() {
  const localQuery = (document.getElementById('vehicle-search')?.value || '').toLowerCase();
  const globalQuery = (document.getElementById('global-search')?.value || '').toLowerCase();
  const query = localQuery || globalQuery;
  const rows = vehicles.filter(vehicle => `${vehicle.id} ${vehicle.owner} ${vehicle.model}`.toLowerCase().includes(query));
  const action = '<button class="button button-primary" data-action="add-vehicle">＋ &nbsp;Add Vehicle</button>';
  return `${heading('Vehicles', 'Registered EVs and charging records.', action)}<div class="filters"><label class="search-field"><span>⌕</span><input id="vehicle-search" placeholder="Search by vehicle ID or owner…" value="${escapeHtml(localQuery)}" /></label></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Vehicle ID</th><th>Owner</th><th>Model</th><th>Battery</th><th>Capacity</th><th>Connector</th><th>Sessions</th><th>Last charge</th><th>Status</th></tr></thead><tbody>${rows.map(vehicle => `<tr><td class="mono">${vehicle.id}</td><td>${escapeHtml(vehicle.owner)}</td><td>${escapeHtml(vehicle.model)}</td><td>${batteryBar(vehicle.battery)}</td><td>${vehicle.capacity} kWh</td><td>${escapeHtml(vehicle.connector)}</td><td><b>${vehicle.sessions}</b></td><td>${escapeHtml(vehicle.last)}</td><td>${pill(vehicle.status)}</td></tr>`).join('') || '<tr><td colspan="9"><div class="empty-state">No vehicles match that search.</div></td></tr>'}</tbody></table></div>`;
}
function renderHistory() {
  const query = (document.getElementById('history-search')?.value || '').toLowerCase();
  const status = document.getElementById('history-status')?.value || 'All Status';
  const rows = history.filter(item => `${item.id} ${item.vehicle} ${item.charger}`.toLowerCase().includes(query) && (status === 'All Status' || item.status === status));
  const pageCount = Math.max(1, Math.ceil(rows.length / 5));
  historyPage = Math.min(historyPage, pageCount);
  const visible = rows.slice((historyPage - 1) * 5, historyPage * 5);
  const actions = '<button class="button button-secondary" data-action="export">↓ &nbsp;Export CSV</button>';
  return `${heading('Charging History', 'Complete log of all charging sessions.', actions)}
    <div class="filters"><label class="search-field"><span>⌕</span><input id="history-search" placeholder="Session, vehicle, charger…" value="${escapeHtml(query)}" /></label><select id="history-status" class="select-field"><option${status === 'All Status' ? ' selected' : ''}>All Status</option><option${status === 'Completed' ? ' selected' : ''}>Completed</option><option${status === 'Stopped' ? ' selected' : ''}>Stopped</option></select></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Session ID</th><th>Date ↑</th><th>Vehicle</th><th>Charger</th><th>Start</th><th>End</th><th>Energy</th><th>Duration</th><th>Status</th></tr></thead><tbody>${visible.map(item => `<tr><td class="mono">${item.id}</td><td>${item.date}</td><td class="mono">${item.vehicle}</td><td class="mono">${item.charger}</td><td class="mono">${item.start}</td><td class="mono">${item.end}</td><td><b style="color:var(--ink)">${item.energy} kWh</b></td><td>${item.duration}</td><td>${pill(item.status)}</td></tr>`).join('') || '<tr><td colspan="9"><div class="empty-state">No sessions match those filters.</div></td></tr>'}</tbody></table></div>
    <div class="table-footer"><span>Showing ${rows.length ? (historyPage - 1) * 5 + 1 : 0}–${Math.min(historyPage * 5, rows.length)} of ${rows.length} records</span><div class="pagination"><button class="page-btn" data-page="${historyPage - 1}" ${historyPage === 1 ? 'disabled' : ''}>←</button>${Array.from({ length: pageCount }, (_, index) => `<button class="page-btn ${historyPage === index + 1 ? 'active' : ''}" data-page="${index + 1}">${index + 1}</button>`).join('')}<button class="page-btn" data-page="${historyPage + 1}" ${historyPage === pageCount ? 'disabled' : ''}>→</button></div></div>`;
}
function render() {
  if (!['dashboard', 'queue', 'vehicles', 'history'].includes(view)) view = 'dashboard';
  document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === view));
  document.getElementById('queue-count').textContent = queue.length;
  root.innerHTML = view === 'queue' ? renderQueue() : view === 'vehicles' ? renderVehicles() : view === 'history' ? renderHistory() : renderDashboard();
}
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
async function assignVehicle(id) {
  try {
    const result = await api(`/queue/${encodeURIComponent(id)}/assign`, { method: 'POST' });
    await refreshData();
    showToast(`${result.vehicle.id} assigned to ${result.charger.id}`);
    render();
  } catch (error) { showToast(error.message); }
}
async function stopCharging(chargerId) {
  try {
    await api(`/chargers/${encodeURIComponent(chargerId)}/stop`, { method: 'POST' });
    await refreshData();
    render();
    showToast(`${chargerId} stopped; charger is available.`);
  } catch (error) { showToast(error.message); }
}
function openChargerManager() {
  const list = document.getElementById('charger-settings-list');
  list.innerHTML = chargers.map(charger => `<div class="charger-setting-row"><div><b>${escapeHtml(charger.id)}</b><span>${escapeHtml(charger.type)}${charger.vehicle ? ` · ${escapeHtml(charger.vehicle)}` : ''}</span></div><select aria-label="${escapeHtml(charger.id)} status" data-charger-status="${escapeHtml(charger.id)}" ${charger.status === 'Charging' ? 'disabled' : ''}>${charger.status === 'Charging' ? '<option selected>Charging</option>' : ''}<option${charger.status === 'Available' ? ' selected' : ''}>Available</option><option${charger.status === 'Maintenance' ? ' selected' : ''}>Maintenance</option><option${charger.status === 'Offline' ? ' selected' : ''}>Offline</option></select></div>`).join('');
  document.getElementById('charger-dialog').showModal();
}
async function saveChargerSettings(event) {
  event.preventDefault();
  const controls = [...document.querySelectorAll('[data-charger-status]:not(:disabled)')];
  const changes = controls.filter(control => chargers.find(charger => charger.id === control.dataset.chargerStatus)?.status !== control.value);
  try {
    for (const control of changes) {
      await api(`/chargers/${encodeURIComponent(control.dataset.chargerStatus)}/status`, { method: 'POST', body: JSON.stringify({ status: control.value }) });
    }
    await refreshData();
    document.getElementById('charger-dialog').close();
    render();
    showToast(changes.length ? 'Charger statuses updated.' : 'No charger changes to save.');
  } catch (error) {
    await refreshData();
    render();
    openChargerManager();
    showToast(error.message);
  }
}
async function recalculateQueue() {
  try {
    await api('/queue/recalculate', { method: 'POST' });
    await refreshData();
    render();
    showToast('Queue recalculated by urgency and wait time.');
  } catch (error) { showToast(error.message); }
}
function exportCsv() {
  const headers = ['Session ID', 'Date', 'Vehicle', 'Charger', 'Start', 'End', 'Energy kWh', 'Duration', 'Status'];
  const lines = [headers, ...history.map(item => [item.id, item.date, item.vehicle, item.charger, item.start, item.end, item.energy, item.duration, item.status])]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([lines], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'voltgrid-charging-history.csv';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Charging history exported.');
}

document.addEventListener('click', event => {
  const nav = event.target.closest('[data-view]');
  if (nav) {
    event.preventDefault(); view = nav.dataset.view; historyPage = 1; location.hash = view;
    document.getElementById('sidebar').classList.remove('open'); render(); return;
  }
  const navigate = event.target.closest('[data-navigate]');
  if (navigate) { view = navigate.dataset.navigate; location.hash = view; render(); return; }
  const assignment = event.target.closest('[data-assign]');
  if (assignment) { assignVehicle(assignment.dataset.assign); return; }
  const stop = event.target.closest('[data-stop]');
  if (stop) { stopCharging(stop.dataset.stop); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'add-vehicle') document.getElementById('vehicle-dialog').showModal();
  if (action === 'manage-chargers') openChargerManager();
  if (action === 'recalculate') recalculateQueue();
  if (action === 'export') exportCsv();
  const page = event.target.closest('[data-page]');
  if (page && !page.disabled) { historyPage = Number(page.dataset.page); render(); }
  const close = event.target.closest('[data-close]');
  if (close) close.closest('dialog')?.close();
});

document.addEventListener('input', event => {
  if (event.target.id === 'vehicle-search') {
    const { value, selectionStart } = event.target;
    render();
    const input = document.getElementById('vehicle-search'); input.focus(); input.setSelectionRange(selectionStart, selectionStart);
  } else if (event.target.id === 'history-search') {
    const { value, selectionStart } = event.target; historyPage = 1; render();
    const input = document.getElementById('history-search'); input.focus(); input.setSelectionRange(selectionStart, selectionStart);
  } else if (event.target.id === 'global-search') {
    view = event.target.value ? 'vehicles' : (location.hash.slice(1) || 'dashboard');
    if (view === 'dashboard' && event.target.value) view = 'vehicles';
    location.hash = view; render();
    const input = document.getElementById('global-search'); input.focus(); input.setSelectionRange(input.value.length, input.value.length);
  }
});
document.addEventListener('change', event => {
  if (event.target.id === 'history-status') { historyPage = 1; render(); }
});
document.getElementById('vehicle-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const id = String(values.get('id')).trim().toUpperCase();
  const vehicle = { id, owner: values.get('owner'), model: values.get('model'), battery: Number(values.get('battery')), target: Number(values.get('target')), capacity: Number(values.get('capacity')), connector: values.get('connector') };
  api('/vehicles', { method: 'POST', body: JSON.stringify(vehicle) }).then(async () => {
    await refreshData(); form.reset(); document.getElementById('vehicle-dialog').close();
    showToast(`${id} added to the fleet and charging queue.`); render();
  }).catch(error => showToast(error.message));
});
document.getElementById('charger-form').addEventListener('submit', saveChargerSettings);
document.getElementById('mobile-menu').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
window.addEventListener('hashchange', () => {
  const next = location.hash.slice(1);
  if (['dashboard', 'queue', 'vehicles', 'history'].includes(next)) { view = next; render(); }
});
refreshData().then(render).catch(error => {
  root.innerHTML = `<section class="panel"><h2>Backend connection failed</h2><p>${escapeHtml(error.message)} Start the C server and reload this page.</p></section>`;
});
setInterval(() => {
  if (view === 'dashboard' || view === 'queue') refreshData().then(render).catch(() => {});
}, 5000);
