/**
 * メインアプリロジック
 */
document.addEventListener('DOMContentLoaded', () => {
  let currentDate = new Date();
  const dateInput = document.getElementById('date-input');
  const chartRow = document.getElementById('chart-row');
  const warningsEl = document.getElementById('warnings');
  const infoEl = document.getElementById('info-row');
  const memberSelector = document.getElementById('member-selector');

  init();

  function init() {
    // 日付初期化
    dateInput.value = formatDate(currentDate);
    dateInput.addEventListener('change', () => {
      currentDate = new Date(dateInput.value + 'T00:00:00');
      render();
    });

    // ボタン
    document.getElementById('btn-prev').addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() - 1);
      dateInput.value = formatDate(currentDate);
      render();
    });
    document.getElementById('btn-next').addEventListener('click', () => {
      currentDate.setDate(currentDate.getDate() + 1);
      dateInput.value = formatDate(currentDate);
      render();
    });
    document.getElementById('btn-today').addEventListener('click', () => {
      currentDate = new Date();
      dateInput.value = formatDate(currentDate);
      render();
    });

    renderMemberSelector();
    render();
  }

  function render() {
    const dayInfo = KuseiEngine.getDayInfo(currentDate);
    renderCharts(dayInfo);
    renderWarnings(dayInfo);
    renderInfo(dayInfo);
    renderPlaceWarnings(dayInfo);

    // ヘッダー日付更新
    document.getElementById('header-date').textContent =
      `${currentDate.getFullYear()}年${currentDate.getMonth()+1}月${currentDate.getDate()}日`;
  }

  function renderCharts(dayInfo) {
    chartRow.innerHTML = '';

    // 年盤
    const yearChart = KuseiChart.renderChart(
      '年盤', dayInfo.year.star, dayInfo.year.positions,
      { goousatsu: dayInfo.year.goousatsu, ankensatsu: dayInfo.year.ankensatsu, saiha: dayInfo.year.saiha },
      'year'
    );
    chartRow.appendChild(yearChart);

    // 月盤
    const monthChart = KuseiChart.renderChart(
      '月盤', dayInfo.month.star, dayInfo.month.positions,
      { goousatsu: dayInfo.month.goousatsu, ankensatsu: dayInfo.month.ankensatsu, saiha: dayInfo.month.geppa },
      'month'
    );
    chartRow.appendChild(monthChart);

    // 日盤
    const dayChart = KuseiChart.renderChart(
      '日盤', dayInfo.day.star, dayInfo.day.positions,
      { goousatsu: dayInfo.day.goousatsu, ankensatsu: dayInfo.day.ankensatsu },
      'day'
    );
    chartRow.appendChild(dayChart);
  }

  function renderWarnings(dayInfo) {
    warningsEl.innerHTML = '';

    // 月日重複チェック
    const doubles = KuseiEngine.getDoubleWarnings(dayInfo);
    for (const dir of doubles) {
      const dirName = KuseiEngine.DIRECTIONS[KuseiEngine.DIR_KEYS.indexOf(dir)];
      addWarning(`${dirName}方位：月日の五黄殺・暗剣殺が重複！`, 'double-warning');
    }

    // 年の凶方位
    if (dayInfo.year.goousatsu) {
      const dirName = KuseiEngine.DIRECTIONS[KuseiEngine.DIR_KEYS.indexOf(dayInfo.year.goousatsu)];
      addWarning(`年五黄殺：${dirName}`, 'danger');
    }
    if (dayInfo.year.ankensatsu) {
      const dirName = KuseiEngine.DIRECTIONS[KuseiEngine.DIR_KEYS.indexOf(dayInfo.year.ankensatsu)];
      addWarning(`年暗剣殺：${dirName}`, 'danger');
    }

    // 月の凶方位
    if (dayInfo.month.goousatsu) {
      const dirName = KuseiEngine.DIRECTIONS[KuseiEngine.DIR_KEYS.indexOf(dayInfo.month.goousatsu)];
      addWarning(`月五黄殺：${dirName}`, 'caution');
    }
    if (dayInfo.month.ankensatsu) {
      const dirName = KuseiEngine.DIRECTIONS[KuseiEngine.DIR_KEYS.indexOf(dayInfo.month.ankensatsu)];
      addWarning(`月暗剣殺：${dirName}`, 'caution');
    }

    // 日の凶方位
    if (dayInfo.day.goousatsu) {
      const dirName = KuseiEngine.DIRECTIONS[KuseiEngine.DIR_KEYS.indexOf(dayInfo.day.goousatsu)];
      addWarning(`日五黄殺：${dirName}`, 'caution');
    }
    if (dayInfo.day.ankensatsu) {
      const dirName = KuseiEngine.DIRECTIONS[KuseiEngine.DIR_KEYS.indexOf(dayInfo.day.ankensatsu)];
      addWarning(`日暗剣殺：${dirName}`, 'caution');
    }
  }

  function addWarning(text, cls) {
    const item = document.createElement('div');
    item.className = `warning-item ${cls}`;
    item.innerHTML = `<span class="warning-icon">${cls === 'double-warning' ? '⛔' : cls === 'danger' ? '🔴' : '🟡'}</span><span>${text}</span>`;
    warningsEl.appendChild(item);
  }

  function renderInfo(dayInfo) {
    infoEl.innerHTML = '';
    const chips = [
      `${dayInfo.kigakuYear}年`,
      `${KuseiEngine.STAR_SHORT[dayInfo.year.star]}年`,
      `${dayInfo.kigakuMonth.month}月`,
      `${KuseiEngine.STAR_SHORT[dayInfo.month.star]}月`,
      `${currentDate.getDate()}日`,
      `${KuseiEngine.STAR_SHORT[dayInfo.day.star]}日`,
    ];
    for (const c of chips) {
      const chip = document.createElement('span');
      chip.className = 'info-chip';
      chip.textContent = c;
      infoEl.appendChild(chip);
    }
  }

  function renderMemberSelector() {
    memberSelector.innerHTML = '';
    const members = FamilyManager.getMembers();
    const active = FamilyManager.getActiveMember();

    for (const m of members) {
      const btn = document.createElement('button');
      btn.className = 'member-btn' + (m.id === active.id ? ' active' : '');
      btn.textContent = `${m.name}（${KuseiEngine.STAR_SHORT[m.honmei]}）`;
      btn.addEventListener('click', () => {
        FamilyManager.setActiveMember(m.id);
        renderMemberSelector();
        render();
      });
      memberSelector.appendChild(btn);
    }
  }

  function renderPlaceWarnings(dayInfo) {
    const placeWarningsEl = document.getElementById('place-warnings');
    if (!placeWarningsEl) return;
    placeWarningsEl.innerHTML = '';

    const places = PlacesManager.getPlaces();
    const member = FamilyManager.getActiveMember();
    for (const place of places) {
      const { dirKey, dirName } = PlacesManager.getPlaceDirection(place);
      const luck = KuseiEngine.getDirectionLuck(dirKey, dayInfo, member.honmei, member.getsu);
      const starName = KuseiEngine.STAR_SHORT[luck.starInDir];

      const item = document.createElement('div');
      if (luck.level === 'bad') {
        item.className = 'warning-item danger';
        item.innerHTML = `<span class="warning-icon">⛔</span><span>${place.name}（${dirName}・${starName}）：${luck.warnings.join('・')}</span>`;
      } else if (luck.level === 'best') {
        item.className = 'warning-item';
        item.style.background = '#FFF8E1';
        item.style.color = '#B8860B';
        item.innerHTML = `<span class="warning-icon">🌟</span><span>${place.name}（${dirName}・${starName}）：本当の吉方位</span>`;
      } else if (luck.level === 'good') {
        item.className = 'warning-item';
        item.style.background = '#e8f5e9';
        item.style.color = '#2e7d32';
        item.innerHTML = `<span class="warning-icon">✅</span><span>${place.name}（${dirName}・${starName}）：吉方位（本命吉）</span>`;
      } else if (luck.level === 'fair') {
        item.className = 'warning-item';
        item.style.background = '#F1F8E9';
        item.style.color = '#558B2F';
        item.innerHTML = `<span class="warning-icon">○</span><span>${place.name}（${dirName}・${starName}）：まずまず（月命吉）</span>`;
      } else {
        item.className = 'warning-item';
        item.style.background = '#f5f5f5';
        item.style.color = '#757575';
        item.innerHTML = `<span class="warning-icon">ー</span><span>${place.name}（${dirName}・${starName}）</span>`;
      }
      placeWarningsEl.appendChild(item);
    }
  }

  function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
});
