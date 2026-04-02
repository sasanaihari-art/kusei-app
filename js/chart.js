/**
 * 九星盤チャート描画（HTMLグリッド版）
 */

const KuseiChart = (() => {

  // グリッド配置: 3x3のマス目における方位の位置
  // [row][col] = dirKey
  const GRID_MAP = [
    ['SE', 'S', 'SW'],
    ['E',  'C', 'W'],
    ['NE', 'N', 'NW']
  ];

  const DIR_LABELS = {
    SE: '巽・南東', S: '離・南', SW: '坤・南西',
    E: '震・東', C: '中央', W: '兌・西',
    NE: '艮・北東', N: '坎・北', NW: '乾・北西'
  };

  /**
   * 九星盤のHTMLを生成
   * @param {string} title - タイトル（年盤/月盤/日盤）
   * @param {number} centerStar - 中央星
   * @param {object} positions - 各方位の星
   * @param {object} warnings - { goousatsu, ankensatsu, saiha/geppa }
   * @param {string} type - 'year'|'month'|'day'
   */
  function renderChart(title, centerStar, positions, warnings, type) {
    const container = document.createElement('div');
    container.className = 'chart-card';

    const titleEl = document.createElement('div');
    titleEl.className = 'chart-card-title';
    titleEl.textContent = `${title}  ${KuseiEngine.STAR_SHORT[centerStar]}`;
    container.appendChild(titleEl);

    const grid = document.createElement('div');
    grid.className = 'kusei-grid';

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const dirKey = GRID_MAP[row][col];
        const star = positions[dirKey];
        const cell = createCell(dirKey, star, warnings, type);
        grid.appendChild(cell);
      }
    }

    container.appendChild(grid);
    return container;
  }

  function createCell(dirKey, star, warnings, type) {
    const cell = document.createElement('div');
    cell.className = 'kusei-cell';

    // 凶方位判定
    const cellWarnings = [];
    if (dirKey === 'C') {
      cell.classList.add('center');
    } else {
      if (warnings.goousatsu === dirKey) {
        cell.classList.add('goousatsu');
        cellWarnings.push('五黄殺');
      }
      if (warnings.ankensatsu === dirKey) {
        cell.classList.add('ankensatsu');
        cellWarnings.push('暗剣殺');
      }
      if (warnings.saiha === dirKey) {
        cell.classList.add('saiha');
        cellWarnings.push(type === 'year' ? '歳破' : '月破');
      }
    }

    // 方位ラベル
    const dirLabel = document.createElement('div');
    dirLabel.className = 'dir-label';
    dirLabel.textContent = DIR_LABELS[dirKey].split('・')[1] || DIR_LABELS[dirKey];
    cell.appendChild(dirLabel);

    // 星番号
    const starNum = document.createElement('div');
    starNum.className = 'star-num';
    starNum.textContent = star;
    starNum.style.color = KuseiEngine.STAR_COLORS[star];
    cell.appendChild(starNum);

    // 星名
    const starName = document.createElement('div');
    starName.className = 'star-name';
    starName.textContent = KuseiEngine.STAR_SHORT[star];
    cell.appendChild(starName);

    // 凶バッジ
    for (const w of cellWarnings) {
      const badge = document.createElement('span');
      badge.className = 'warning-badge';
      if (w === '五黄殺') badge.classList.add('badge-goou');
      else if (w === '暗剣殺') badge.classList.add('badge-anken');
      else if (w === '歳破') badge.classList.add('badge-saiha');
      else badge.classList.add('badge-geppa');
      badge.textContent = w;
      cell.appendChild(badge);
    }

    return cell;
  }

  return { renderChart, GRID_MAP, DIR_LABELS };
})();
