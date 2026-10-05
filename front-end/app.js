let vehicles = [
  { id: 'AP39AB1234', owner: 'krian', model: 'Tata Nexon EV', battery: 64, capacity: 40.5, connector: 'CCS2', sessions: 24, last: 'Today 14:08', status: 'Charging' },
  { id: 'AP40CD5678', owner: 'sandhya', model: 'MG ZS EV', battery: 15, capacity: 50.3, connector: 'CCS2', sessions: 18, last: 'Yesterday 18:22', status: 'Queued' },
  { id: 'MH12AB5678', owner: 'gowtham', model: 'Hyundai Ioniq 5', battery: 41, capacity: 72.6, connector: 'CCS2', sessions: 31, last: 'Today 14:24', status: 'Charging' },
  { id: 'KA01CD9012', owner: 'kishore', model: 'Kia EV6', battery: 77, capacity: 77.4, connector: 'Type 2', sessions: 12, last: 'Today 13:50', status: 'Charging' },
  { id: 'TN09KL2345', owner: 'akhil', model: 'Ola S1 Pro', battery: 55, capacity: 3.97, connector: 'CCS2', sessions: 45, last: 'Today 14:15', status: 'Charging' },
  { id: 'AP39NV2007', owner: 'sneha', model: 'Nexon EV Max', battery: 19, capacity: 40.5, connector: 'Type 2', sessions: 9, last: '2 days ago', status: 'Queued' },
];
let queue = [
  { id: 'AP39AB1234', owner: 'kiran', battery: 8, requested: 35, waiting: 4, arrival: '14:32' },
  { id: 'AP40CD5678', owner: 'sandhya', battery: 15, requested: 40, waiting: 8, arrival: '14:28' },
  { id: 'MH12AB5678', owner: 'gowtham', battery: 42, requested: 25, waiting: 12, arrival: '14:24' },
  { id: 'KA01CD9012', owner: 'kishore', battery: 19, requested: 30, waiting: 15, arrival: '14:21' },
  { id: 'TN09KL2345', owner: 'akhil', battery: 28, requested: 45, waiting: 23, arrival: '14:13' },
  { id: 'AP39NV2007', owner: 'sneha', battery: 2, requested: 20, waiting: 30, arrival: '16:22' },
  { id:'AP34FD9980', owner:'abhi',battery:3,requested: 30,waiting:12,arrival:'07:54'}

];
let chargers = [
  { id: 'CH-01', type: 'CCS2', status: 'Available' },
  { id: 'CH-02', type: 'CCS2', status: 'Available' },
  { id: 'CH-03', type: 'Type 2', status: 'Maintenance' },
  { id: 'CH-04', type: 'CCS2', status: 'Available' },
  { id: 'CH-05', type: 'Type 2', status: 'Available' },
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
let editingVehicleId = null;

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
    <div class="table-wrap"><table class="data-table"><thead><tr><th>#</th><th>Vehicle ID</th><th>Owner</th><th>Battery</th><th>Target charge</th><th>Priority</th><th>Waiting / estimate</th><th>Arrival</th><th>Actions</th></tr></thead><tbody>${queue.map((item, index) => `<tr class="${priority(item.battery) === 'Emergency' ? 'urgent-row' : ''}"><td><span class="rank ${safeClass(priority(item.battery))}">${index + 1}</span></td><td class="mono">${escapeHtml(item.id)}</td><td>${escapeHtml(item.owner)}</td><td>${batteryBar(item.battery)}</td><td>${item.target || 80}%</td><td>${pill(priority(item.battery))}</td><td>${item.waiting} min waited<br><span class="subtext">Est. ${index * 6} min</span></td><td class="mono">${escapeHtml(item.arrival)}</td><td><div class="row-actions"><button class="button button-primary button-small" data-assign="${escapeHtml(item.id)}">Assign</button><button class="button button-secondary button-small" data-edit-queue="${escapeHtml(item.id)}">Edit</button><button class="button button-danger button-small" data-delete-queue="${escapeHtml(item.id)}">Delete</button></div></td></tr>`).join('') || '<tr><td colspan="9"><div class="empty-state">The charging queue is empty.</div></td></tr>'}</tbody></table></div>`;
}
function renderVehicles() {
  const localQuery = (document.getElementById('vehicle-search')?.value || '').toLowerCase();
  const globalQuery = (document.getElementById('global-search')?.value || '').toLowerCase();
  const query = localQuery || globalQuery;
  const rows = vehicles.filter(vehicle => `${vehicle.id} ${vehicle.owner} ${vehicle.model}`.toLowerCase().includes(query));
  const action = '<button class="button button-primary" data-action="add-vehicle">＋ &nbsp;Add Vehicle</button>';
  return `${heading('Vehicles', 'Registered EVs and charging records.', action)}<div class="filters"><label class="search-field"><span>⌕</span><input id="vehicle-search" placeholder="Search by vehicle ID or owner…" value="${escapeHtml(localQuery)}" /></label></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Vehicle ID</th><th>Owner</th><th>Model</th><th>Battery</th><th>Capacity</th><th>Connector</th><th>Sessions</th><th>Last charge</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(vehicle => `<tr><td class="mono">${escapeHtml(vehicle.id)}</td><td>${escapeHtml(vehicle.owner)}</td><td>${escapeHtml(vehicle.model)}</td><td>${batteryBar(vehicle.battery)}</td><td>${vehicle.capacity} kWh</td><td>${escapeHtml(vehicle.connector)}</td><td><b>${vehicle.sessions}</b></td><td>${escapeHtml(vehicle.last)}</td><td>${pill(vehicle.status)}</td><td><div class="row-actions"><button class="button button-secondary button-small" data-edit-vehicle="${escapeHtml(vehicle.id)}">Edit</button><button class="button button-danger button-small" data-delete-vehicle="${escapeHtml(vehicle.id)}">Delete</button></div></td></tr>`).join('') || `<tr><td colspan="10"><div class="empty-state">${query ? 'No vehicles match that search.' : 'No vehicles have been registered.'}</div></td></tr>`}</tbody></table></div>`;
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
function openVehicleDialog(id = null) {
  const dialog = document.getElementById('vehicle-dialog');
  const form = document.getElementById('vehicle-form');
  const vehicle = id === null ? null : vehicles.find(item => item.id === id);
  if (id !== null && !vehicle) {
    showToast('That vehicle is no longer in the fleet. Refresh and try again.');
    return;
  }
  editingVehicleId = vehicle?.id || null;
  form.reset();
  form.elements.namedItem('id').readOnly = Boolean(vehicle);
  form.elements.namedItem('id').maxLength = 31;
  form.elements.namedItem('owner').value = vehicle?.owner || '';
  form.elements.namedItem('model').value = vehicle?.model || '';
  form.elements.namedItem('battery').value = vehicle?.battery ?? 50;
  form.elements.namedItem('battery').disabled = vehicle?.status === 'Charging';
  form.elements.namedItem('target').value = 80;
  form.elements.namedItem('capacity').value = vehicle?.capacity ?? 50;
  form.elements.namedItem('connector').value = vehicle?.connector || 'CCS2';
  dialog.querySelector('h2').textContent = vehicle ? `Edit ${vehicle.id}` : 'Add a vehicle';
  form.querySelector('[type="submit"]').textContent = vehicle ? 'Save changes' : 'Add vehicle';
  dialog.showModal();
}
function openQueueEditDialog(id) {
  const item = queue.find(entry => entry.id === id);
  if (!item) {
    showToast('That queue entry is no longer waiting. Refresh and try again.');
    return;
  }
  const form = document.getElementById('queue-edit-form');
  form.elements.namedItem('id').value = item.id;
  form.elements.namedItem('owner').value = item.owner;
  form.elements.namedItem('battery').value = item.battery;
  form.elements.namedItem('target').value = item.target || 80;
  form.elements.namedItem('requested').value = item.requested;
  document.getElementById('queue-edit-dialog').showModal();
}
async function saveQueueEdit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.namedItem('id').value;
  const values = new FormData(form);
  const updated = {
    owner: values.get('owner'),
    battery: Number(values.get('battery')),
    target: Number(values.get('target')),
    requested: Number(values.get('requested'))
  };
  try {
    await api(`/queue/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(updated) });
    await refreshData();
    document.getElementById('queue-edit-dialog').close();
    render();
    showToast(`${id} queue entry updated.`);
  } catch (error) {
    showToast(error.message);
  }
}
async function deleteQueueEntry(id) {
  if (!window.confirm(`Remove ${id} from the charging queue? The vehicle will remain in the fleet.`))
    return;
  try {
    await api(`/queue/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await refreshData();
    render();
    showToast(`${id} removed from the queue.`);
  } catch (error) {
    showToast(error.message);
  }
}
async function deleteVehicle(id) {
  if (!window.confirm(`Permanently delete ${id} from the fleet? Any waiting queue entry will also be removed.`))
    return;
  try {
    await api(`/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await refreshData();
    render();
    showToast(`${id} deleted from the fleet.`);
  } catch (error) {
    showToast(error.message);
  }
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
  const editVehicle = event.target.closest('[data-edit-vehicle]');
  if (editVehicle) { openVehicleDialog(editVehicle.dataset.editVehicle); return; }
  const deleteVehicleButton = event.target.closest('[data-delete-vehicle]');
  if (deleteVehicleButton) { deleteVehicle(deleteVehicleButton.dataset.deleteVehicle); return; }
  const editQueue = event.target.closest('[data-edit-queue]');
  if (editQueue) { openQueueEditDialog(editQueue.dataset.editQueue); return; }
  const deleteQueueButton = event.target.closest('[data-delete-queue]');
  if (deleteQueueButton) { deleteQueueEntry(deleteQueueButton.dataset.deleteQueue); return; }
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'add-vehicle') openVehicleDialog();
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
document.getElementById('vehicle-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const id = String(values.get('id')).trim().toUpperCase();
  const vehicle = {
    owner: values.get('owner'),
    model: values.get('model'),
    battery: values.has('battery') ? Number(values.get('battery')) : undefined,
    capacity: Number(values.get('capacity')),
    connector: values.get('connector')
  };
  try {
    await refreshData();
    if (editingVehicleId && !vehicles.some(existing => existing.id === editingVehicleId)) {
      document.getElementById('vehicle-dialog').close();
      showToast('That vehicle is no longer in the fleet. Refresh and try again.');
      return;
    }
    if (!editingVehicleId && vehicles.some(existing => existing.id.toUpperCase() === id)) {
      showToast(`${id} is already registered. Enter a unique vehicle ID.`);
      form.elements.namedItem('id').focus();
      return;
    }
    if (editingVehicleId) {
      await api(`/vehicles/${encodeURIComponent(editingVehicleId)}`, { method: 'PUT', body: JSON.stringify(vehicle) });
    } else {
      vehicle.id = id;
      vehicle.target = Number(values.get('target'));
      await api('/vehicles', { method: 'POST', body: JSON.stringify(vehicle) });
    }
    await refreshData();
    form.reset();
    document.getElementById('vehicle-dialog').close();
    const wasEditing = editingVehicleId !== null;
    editingVehicleId = null;
    render();
    showToast(wasEditing ? `${id} updated.` : `${id} added to the fleet and charging queue.`);
  } catch (error) {
    showToast(error.message);
  }
});
document.getElementById('queue-edit-form').addEventListener('submit', saveQueueEdit);
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
  if (view === 'dashboard' || view === 'queue') refreshData().then(render).catch(() => { });
}, 5000);
