const serverData = generateServers();

const state = {
  search: '',
  country: 'all',
  version: 'all',
  playersMax: 250,
  sortBy: 'players',
  activeServer: null,
};

const statConfig = [
  { key: 'totalServers', label: 'Total Servers', icon: 'fa-server', color: 'cyan' },
  { key: 'onlinePlayers', label: 'Online Players', icon: 'fa-players', color: 'violet' },
  { key: 'countries', label: 'Countries', icon: 'fa-earth-americas', color: 'green' },
  { key: 'versions', label: 'Versions', icon: 'fa-code-branch', color: 'cyan' },
  { key: 'avgLatency', label: 'Avg Latency', icon: 'fa-wifi', color: 'green' },
];

const chartRegistry = {};

const els = {
  statsGrid: document.getElementById('statsGrid'),
  serversGrid: document.getElementById('serversGrid'),
  countryFilter: document.getElementById('countryFilter'),
  versionFilter: document.getElementById('versionFilter'),
  searchInput: document.getElementById('searchInput'),
  playerSlider: document.getElementById('playerSlider'),
  sliderValue: document.getElementById('sliderValue'),
  sortFilter: document.getElementById('sortFilter'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  modal: document.getElementById('serverModal'),
  modalClose: document.querySelector('.modal-close'),
  modalBackdrop: document.querySelector('.modal-backdrop'),
  modalTitle: document.getElementById('modalTitle'),
  modalIp: document.getElementById('modalIp'),
  modalCountry: document.getElementById('modalCountry'),
  modalVersion: document.getElementById('modalVersion'),
  modalPlayers: document.getElementById('modalPlayers'),
  modalMaxPlayers: document.getElementById('modalMaxPlayers'),
  modalPing: document.getElementById('modalPing'),
  modalMotd: document.getElementById('modalMotd'),
  versionHistoryList: document.getElementById('versionHistoryList'),
  modalUptime: document.getElementById('modalUptime'),
  modalPeak: document.getElementById('modalPeak'),
  modalLatency: document.getElementById('modalLatency'),
  modalLastSeen: document.getElementById('modalLastSeen'),
};

init();

function init() {
  populateFilters();
  renderStats();
  renderServers();
  renderCharts();
  bindEvents();
  animateCounters();
}

function bindEvents() {
  els.searchInput.addEventListener('input', (e) => {
    state.search = e.target.value.trim().toLowerCase();
    renderServers();
  });

  els.countryFilter.addEventListener('change', (e) => {
    state.country = e.target.value;
    renderServers();
  });

  els.versionFilter.addEventListener('change', (e) => {
    state.version = e.target.value;
    renderServers();
  });

  els.sortFilter.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderServers();
  });

  els.playerSlider.addEventListener('input', (e) => {
    state.playersMax = Number(e.target.value);
    els.sliderValue.textContent = state.playersMax >= 250 ? '250+' : `${state.playersMax}`;
    renderServers();
  });

  els.resetFiltersBtn.addEventListener('click', () => {
    resetFilters();
  });

  els.modalClose.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !els.modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  document.querySelector('.primary-btn').addEventListener('click', () => {
    document.getElementById('explorer').scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelector('.secondary-btn').addEventListener('click', () => {
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
  });
}

function resetFilters() {
  state.search = '';
  state.country = 'all';
  state.version = 'all';
  state.playersMax = 250;
  state.sortBy = 'players';

  els.searchInput.value = '';
  els.countryFilter.value = 'all';
  els.versionFilter.value = 'all';
  els.sortFilter.value = 'players';
  els.playerSlider.value = 250;
  els.sliderValue.textContent = '250+';

  renderServers();
}

function populateFilters() {
  const countries = [...new Set(serverData.map((server) => server.country))].sort();
  const versions = [...new Set(serverData.map((server) => server.version))].sort((a, b) => {
    const av = parseFloat(a);
    const bv = parseFloat(b);
    if (!Number.isNaN(av) && !Number.isNaN(bv)) return bv - av;
    return a.localeCompare(b);
  });

  countries.forEach((country) => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    els.countryFilter.appendChild(option);
  });

  versions.forEach((version) => {
    const option = document.createElement('option');
    option.value = version;
    option.textContent = version;
    els.versionFilter.appendChild(option);
  });
}

function renderStats() {
  const totalPlayers = serverData.reduce((sum, srv) => sum + srv.players, 0);
  const uniqueCountries = new Set(serverData.map((srv) => srv.country)).size;
  const uniqueVersions = new Set(serverData.map((srv) => srv.version)).size;
  const avgLatency = Math.round(serverData.reduce((sum, srv) => sum + srv.ping, 0) / serverData.length);

  const stats = {
    totalServers: serverData.length,
    onlinePlayers: totalPlayers,
    countries: uniqueCountries,
    versions: uniqueVersions,
    avgLatency: `${avgLatency}ms`,
  };

  els.statsGrid.innerHTML = statConfig
    .map((metric) => {
      const value = stats[metric.key];
      const iconClass = metric.icon;
      const trend = metric.key === 'totalServers' ? '+12.4%' : metric.key === 'onlinePlayers' ? '+8.9%' : metric.key === 'countries' ? '+3.1%' : metric.key === 'versions' ? '+2.0%' : '-4.1%';
      const colorClass = metric.color;
      return `
        <article class="stat-card glass-panel ${colorClass}">
          <div class="stat-icon"><i class="fa-solid ${iconClass}"></i></div>
          <span class="value">${value}</span>
          <span class="label">${metric.label}</span>
          <span class="trend"><i class="fa-solid fa-arrow-trend-up"></i> ${trend}</span>
        </article>
      `;
    })
    .join('');
}

function getFilteredServers() {
  return serverData
    .filter((server) => {
      const matchesSearch = !state.search ||
        [server.ip, server.name, server.country, server.version, server.motd]
          .join(' ')
          .toLowerCase()
          .includes(state.search);

      const matchesCountry = state.country === 'all' || server.country === state.country;
      const matchesVersion = state.version === 'all' || server.version === state.version;
      const matchesPlayers = server.players <= state.playersMax;

      return matchesSearch && matchesCountry && matchesVersion && matchesPlayers;
    })
    .sort((a, b) => {
      switch (state.sortBy) {
        case 'country':
          return a.country.localeCompare(b.country) || b.players - a.players;
        case 'version':
          return a.version.localeCompare(b.version) || b.players - a.players;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'players':
        default:
          return b.players - a.players;
      }
    });
}

function renderServers() {
  const filtered = getFilteredServers();

  els.serversGrid.innerHTML = filtered
    .map(
      (server) => `
        <article class="server-card glass-panel" data-server-id="${server.id}" tabindex="0">
          <div class="server-header">
            <div>
              <h3 class="server-name">${server.name}</h3>
              <div class="server-ip">${server.ip}</div>
            </div>
            <span class="server-badge">${server.status}</span>
          </div>

          <p class="server-motd">${server.motd}</p>

          <div class="server-meta">
            <div class="meta-item">
              <span>Players</span>
              <strong>${server.players}</strong>
            </div>
            <div class="meta-item">
              <span>Max</span>
              <strong>${server.maxPlayers}</strong>
            </div>
            <div class="meta-item">
              <span>Version</span>
              <strong>${server.version}</strong>
            </div>
            <div class="meta-item">
              <span>Country</span>
              <strong>${server.country}</strong>
            </div>
          </div>

          <div class="server-footer">
            <span class="ping"><span class="signal"></span>${server.ping}ms</span>
            <span>Last seen ${server.lastSeen}</span>
          </div>
        </article>
      `,
    )
    .join('');

  if (!filtered.length) {
    els.serversGrid.innerHTML = `
      <div class="glass-panel server-card" style="grid-column: 1 / -1; min-height: 180px; display: grid; place-items: center;">
        <div style="text-align:center; color: var(--muted);">
          <h3 style="margin-bottom: 12px;">No servers found</h3>
          <p>Try broadening your filters.</p>
        </div>
      </div>
    `;
  }

  document.querySelectorAll('.server-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = Number(card.dataset.serverId);
      openModal(serverData.find((server) => server.id === id));
    });

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const id = Number(card.dataset.serverId);
        openModal(serverData.find((server) => server.id === id));
      }
    });
  });
}

function openModal(server) {
  if (!server) return;
  state.activeServer = server;

  els.modalTitle.textContent = server.name;
  els.modalIp.textContent = server.ip;
  els.modalCountry.textContent = server.country;
  els.modalVersion.textContent = server.version;
  els.modalPlayers.textContent = `${server.players}`;
  els.modalMaxPlayers.textContent = `${server.maxPlayers}`;
  els.modalPing.textContent = `${server.ping} ms`;
  els.modalMotd.textContent = server.motd;
  els.modalUptime.textContent = server.uptime;
  els.modalPeak.textContent = `${server.peakPlayers} players`;
  els.modalLatency.textContent = `${server.avgLatency} ms`;
  els.modalLastSeen.textContent = server.lastSeen;

  els.versionHistoryList.innerHTML = server.versionHistory
    .map((version) => `<li><span>${version.label}</span><strong>${version.date}</strong></li>`)
    .join('');

  els.modal.classList.remove('hidden');
  els.modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  els.modal.classList.add('hidden');
  els.modal.setAttribute('aria-hidden', 'true');
}

function renderCharts() {
  const ctxPlayers = document.getElementById('playersVersionChart');
  const ctxCountry = document.getElementById('countryChart');
  const ctxTop = document.getElementById('topServersChart');
  const ctxTrend = document.getElementById('onlineTrendChart');

  const versionTotals = Object.entries(
    serverData.reduce((acc, server) => {
      acc[server.version] = (acc[server.version] || 0) + server.players;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const countryTotals = Object.entries(
    serverData.reduce((acc, server) => {
      acc[server.country] = (acc[server.country] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const topServers = [...serverData].sort((a, b) => b.players - a.players).slice(0, 10);
  const onlineTrend = generateTrendData();

  chartRegistry.playersVersion = new Chart(ctxPlayers, {
    type: 'bar',
    data: {
      labels: versionTotals.slice(0, 8).map(([label]) => label),
      datasets: [{
        label: 'Players',
        data: versionTotals.slice(0, 8).map(([, value]) => value),
        backgroundColor: ['#00d4ff', '#7c3aed', '#22c55e', '#f59e0b', '#2dd4bf', '#f472b6', '#38bdf8', '#60a5fa'],
        borderRadius: 12,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: 'rgba(203,213,225,0.8)' }, grid: { display: false } },
        y: { ticks: { color: 'rgba(203,213,225,0.8)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });

  chartRegistry.country = new Chart(ctxCountry, {
    type: 'doughnut',
    data: {
      labels: countryTotals.map(([label]) => label),
      datasets: [{
        data: countryTotals.map(([, value]) => value),
        backgroundColor: ['#00d4ff', '#7c3aed', '#22c55e', '#f59e0b', '#8b5cf6', '#38bdf8'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: { legend: { position: 'bottom', labels: { color: 'rgba(203,213,225,0.8)' } } },
    },
  });

  chartRegistry.top = new Chart(ctxTop, {
    type: 'line',
    data: {
      labels: topServers.map((server) => server.name.replace('Minecraft ', '').slice(0, 15)),
      datasets: [{
        label: 'Players',
        data: topServers.map((server) => server.players),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0,212,255,0.18)',
        fill: true,
        pointBackgroundColor: '#7c3aed',
        tension: 0.25,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: 'rgba(203,213,225,0.8)', maxRotation: 30, minRotation: 30 }, grid: { display: false } },
        y: { ticks: { color: 'rgba(203,213,225,0.8)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });

  chartRegistry.trend = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: onlineTrend.map((item) => item.label),
      datasets: [{
        label: 'Online Trend',
        data: onlineTrend.map((item) => item.value),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.18)',
        fill: true,
        pointBackgroundColor: '#00d4ff',
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: 'rgba(203,213,225,0.8)' }, grid: { display: false } },
        y: { ticks: { color: 'rgba(203,213,225,0.8)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });
}

function animateCounters() {
  const counters = document.querySelectorAll('.count-up');
  counters.forEach((counter) => {
    const target = Number(counter.dataset.target);
    let current = 0;
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      current = Math.floor(progress * target);
      counter.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

function generateServers() {
  const countries = ['United States', 'Germany', 'Canada', 'France', 'United Kingdom', 'Brazil', 'Australia', 'Japan', 'Netherlands', 'South Korea', 'Spain', 'Sweden'];
  const versions = ['1.20.4', '1.19.4', '1.18.2', '1.16.5', '1.8.9'];
  const names = [
    'BlockBastion', 'SkylineCraft', 'PixelHaven', 'MineNova', 'CobaltCore', 'EnderGrid',
    'RiftRealm', 'EmeraldPeak', 'DriftMine', 'QuartzQuest', 'SummitByte', 'NovaForge', 'MoonMine', 'CrystalDome',
    'LavaNest', 'PrismPVP', 'NorthStar', 'AtlasWorld', 'Arcadia', 'VoidCraft', 'QuantumBlock', 'HorizonMine', 'FrostCraft',
    'VoxelRush', 'MineOrbit', 'ZionWorld', 'MagmaPvP', 'StormCore', 'CreepNation', 'TitanMine'
  ];

  const serverTemplates = [
    { type: 'Survival', motd: 'Hardcore survival • custom biomes • community events', status: 'Live' },
    { type: 'PVP', motd: 'Faction wars • ranked ladders • weekly tournaments', status: 'Busy' },
    { type: 'Skyblock', motd: 'Automation islands • economy • co-op growth', status: 'Live' },
    { type: 'Creative', motd: 'Build contests • community plots • shared tools', status: 'Open' },
    { type: 'MiniGame', motd: 'Bed wars • parkour • TNT run • quests', status: 'Live' },
  ];

  const results = [];
  for (let i = 0; i < 60; i++) {
    const name = names[i % names.length] + (i > names.length - 1 ? `-${(i % 7) + 1}` : '');
    const country = countries[i % countries.length];
    const version = versions[i % versions.length];
    const template = serverTemplates[i % serverTemplates.length];
    const players = Math.floor(Math.random() * 200) + 6;
    const maxPlayers = Math.max(32, Math.floor(Math.random() * 240) + 80);
    const ping = Math.floor(Math.random() * 40) + 22;
    const peakPlayers = Math.min(maxPlayers, players + Math.floor(Math.random() * 40) + 12);
    const lastSeenHours = Math.floor(Math.random() * 7) + 1;

    results.push({
      id: i + 1,
      name,
      ip: `mc.${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.net`,
      country,
      version,
      players,
      maxPlayers,
      ping,
      motd: template.motd,
      status: template.status,
      lastSeen: `${lastSeenHours}h ago`,
      uptime: `${(97 + Math.random() * 2.7).toFixed(2)}%`,
      peakPlayers,
      avgLatency: Math.floor(Math.random() * 25) + 32,
      versionHistory: [
        { label: '1.16.5', date: 'Apr 2024' },
        { label: '1.18.2', date: 'Aug 2024' },
        { label: version, date: 'Now' },
      ],
    });
  }

  return results;
}

function generateTrendData() {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label, index) => ({
    label,
    value: 7600 + index * 310 + Math.floor(Math.random() * 900),
  }));
}
