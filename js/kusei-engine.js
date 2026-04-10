/**
 * 九星気学 計算エンジン
 * 年盤・月盤・日盤の九星配置、五黄殺・暗剣殺・歳破の算出
 */

const KuseiEngine = (() => {
  // 九星名
  const STAR_NAMES = [
    '', '一白水星', '二黒土星', '三碧木星', '四緑木星',
    '五黄土星', '六白金星', '七赤金星', '八白土星', '九紫火星'
  ];

  const STAR_SHORT = ['', '一白', '二黒', '三碧', '四緑', '五黄', '六白', '七赤', '八白', '九紫'];

  const STAR_COLORS = [
    '', '#1a73e8', '#8B4513', '#2E7D32', '#4CAF50',
    '#FF9800', '#CFD8DC', '#E53935', '#F5F5F5', '#7B1FA2'
  ];

  // 八方位名（後天定位盤の配置順: SE, S, SW, E, center, W, NE, N, NW）
  const DIRECTIONS = ['南東', '南', '南西', '東', '中央', '西', '北東', '北', '北西'];
  const DIR_KEYS = ['SE', 'S', 'SW', 'E', 'C', 'W', 'NE', 'N', 'NW'];

  // 後天定位盤（中央=5の時の配置）
  // SE=4, S=9, SW=2, E=3, C=5, W=7, NE=8, N=1, NW=6
  const BASE_POSITIONS = [4, 9, 2, 3, 5, 7, 8, 1, 6];

  // 十二支
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 方位角度（30°/60°方式）
  const DIR_ANGLES = {
    N:  { start: 345, end: 15,  width: 30 },
    NE: { start: 15,  end: 75,  width: 60 },
    E:  { start: 75,  end: 105, width: 30 },
    SE: { start: 105, end: 165, width: 60 },
    S:  { start: 165, end: 195, width: 30 },
    SW: { start: 195, end: 255, width: 60 },
    W:  { start: 255, end: 285, width: 30 },
    NW: { start: 285, end: 345, width: 60 }
  };

  // 反対方位
  const OPPOSITE_DIR = {
    N: 'S', S: 'N', E: 'W', W: 'E',
    NE: 'SW', SW: 'NE', SE: 'NW', NW: 'SE'
  };

  // 十二支 → 方位
  const BRANCH_TO_DIR = {
    '子': 'N', '丑': 'NE', '寅': 'NE', '卯': 'E',
    '辰': 'SE', '巳': 'SE', '午': 'S', '未': 'SW',
    '申': 'SW', '酉': 'W', '戌': 'NW', '亥': 'NW'
  };

  // 節入り日データ（各月の節入り日）
  // 月の区切り: 立春(2月)、啓蟄(3月)、清明(4月)、立夏(5月)、芒種(6月)、
  //            小暑(7月)、立秋(8月)、白露(9月)、寒露(10月)、立冬(11月)、大雪(12月)、小寒(1月)
  // format: [month, day] - 節入り日（その日から新しい月が始まる）
  const SETSUIRI = {
    2024: [[1,6],[2,4],[3,5],[4,4],[5,5],[6,5],[7,6],[8,7],[9,7],[10,8],[11,7],[12,7]],
    2025: [[1,5],[2,3],[3,5],[4,4],[5,5],[6,5],[7,7],[8,7],[9,7],[10,8],[11,7],[12,7]],
    2026: [[1,5],[2,4],[3,5],[4,5],[5,5],[6,5],[7,7],[8,7],[9,7],[10,8],[11,7],[12,7]],
    2027: [[1,5],[2,4],[3,5],[4,5],[5,5],[6,6],[7,7],[8,7],[9,8],[10,8],[11,7],[12,7]],
    2028: [[1,6],[2,4],[3,5],[4,4],[5,5],[6,5],[7,6],[8,7],[9,7],[10,8],[11,7],[12,7]],
    2029: [[1,5],[2,3],[3,5],[4,4],[5,5],[6,5],[7,7],[8,7],[9,7],[10,8],[11,7],[12,7]],
    2030: [[1,5],[2,4],[3,5],[4,5],[5,5],[6,5],[7,7],[8,7],[9,7],[10,8],[11,7],[12,7]],
    2031: [[1,5],[2,4],[3,5],[4,5],[5,5],[6,6],[7,7],[8,7],[9,8],[10,8],[11,7],[12,7]],
    2032: [[1,6],[2,4],[3,5],[4,4],[5,5],[6,5],[7,6],[8,7],[9,7],[10,8],[11,7],[12,7]],
    2033: [[1,5],[2,3],[3,5],[4,4],[5,5],[6,5],[7,7],[8,7],[9,7],[10,8],[11,7],[12,7]],
    2034: [[1,5],[2,4],[3,5],[4,5],[5,5],[6,5],[7,7],[8,7],[9,7],[10,8],[11,7],[12,7]],
    2035: [[1,5],[2,4],[3,6],[4,5],[5,6],[6,6],[7,7],[8,7],[9,8],[10,8],[11,7],[12,7]],
    2036: [[1,6],[2,4],[3,5],[4,4],[5,5],[6,5],[7,6],[8,7],[9,7],[10,8],[11,7],[12,7]],
  };

  // 基準甲子日（2026年6月19日 = 甲子日、暦より確認済み）
  const REF_KINOE_NE = new Date(2026, 5, 19);
  const MS_PER_DAY = 86400000;

  /**
   * 指定した日付に最も近い甲子日を返す
   * 甲子日は60日周期で巡る
   */
  function nearestKinoeNe(targetDate) {
    const diff = Math.round((targetDate.getTime() - REF_KINOE_NE.getTime()) / MS_PER_DAY);
    const pos = ((diff % 60) + 60) % 60; // 0 = 甲子日
    const before = new Date(targetDate.getTime() - pos * MS_PER_DAY);
    const after = new Date(before.getTime() + 60 * MS_PER_DAY);
    return Math.abs(targetDate - before) <= Math.abs(targetDate - after) ? before : after;
  }

  /**
   * 指定年の陽遁・陰遁切替日（甲子日）を取得
   * 陽遁: 前年冬至に最も近い甲子日から一白(1)で上昇
   * 陰遁: 夏至に最も近い甲子日から九紫(9)で下降
   */
  function getTransitions(year) {
    const summerSolstice = new Date(year, 5, 21);
    const prevWinterSolstice = new Date(year - 1, 11, 22);
    const winterSolstice = new Date(year, 11, 22);
    return {
      youtonStart: nearestKinoeNe(prevWinterSolstice),
      intonStart: nearestKinoeNe(summerSolstice),
      nextYoutonStart: nearestKinoeNe(winterSolstice)
    };
  }

  /**
   * 年の中央星を算出
   * 気学の年は立春（2月初旬）から始まる
   */
  function getYearStar(date) {
    const year = getKigakuYear(date);
    // 2026年=一白水星 から逆算: (11 - (year % 9)) % 9 || 9
    // 2026 % 9 = 1, (11-1)%9 = 1 → 一白 ✓
    let star = (11 - (year % 9)) % 9;
    if (star === 0) star = 9;
    return star;
  }

  /**
   * 気学上の年（立春基準）
   */
  function getKigakuYear(date) {
    const year = date.getFullYear();
    const setsuiri = SETSUIRI[year];
    if (!setsuiri) return year;
    // 立春（index=1 = 2月の節入り）
    const risshun = new Date(year, 1, setsuiri[1][1]);
    return date >= risshun ? year : year - 1;
  }

  /**
   * 気学上の月（節入り基準）を取得
   * 返り値: { month: 1-12, year: 気学年 }
   */
  function getKigakuMonth(date) {
    const calYear = date.getFullYear();
    const kigakuYear = getKigakuYear(date);

    // 現在の暦年の節入りデータ
    const setsuiri = SETSUIRI[calYear];
    if (!setsuiri) return { month: date.getMonth() + 1, year: kigakuYear };

    // 各月の節入り日と照合
    // SETSUIRI配列: index 0=1月(小寒), 1=2月(立春), ..., 11=12月(大雪)
    const calMonth = date.getMonth(); // 0-based
    const calDay = date.getDate();

    // 節入り日
    const setsuDay = setsuiri[calMonth][1];

    if (calDay >= setsuDay) {
      // 節入り後 → その月
      return { month: calMonth + 1, year: kigakuYear };
    } else {
      // 節入り前 → 前月
      if (calMonth === 0) {
        // 1月で小寒前 → 前年12月
        return { month: 12, year: kigakuYear };
      }
      return { month: calMonth, year: kigakuYear };
    }
  }

  /**
   * 月の中央星を算出
   */
  function getMonthStar(date) {
    const yearStar = getYearStar(date);
    const { month } = getKigakuMonth(date);

    // 年の中央星から月星を算出するテーブル
    // 一白・四緑・七赤の年: 2月=8, 3月=7, ... (逆順に下降)
    // 二黒・五黄・八白の年: 2月=5, 3月=4, ...
    // 三碧・六白・九紫の年: 2月=2, 3月=1, ...
    const group = ((yearStar - 1) % 3); // 0=一四七, 1=二五八, 2=三六九

    // 2月の開始星
    const febStarts = [8, 5, 2]; // 一四七系, 二五八系, 三六九系
    const febStar = febStarts[group];

    // 2月からの月数
    const monthOffset = ((month - 2) + 12) % 12;

    // 月星は逆行（下降）
    let star = febStar - monthOffset;
    while (star <= 0) star += 9;
    return star;
  }

  /**
   * 日の中央星を算出
   * 甲子日ベースの陽遁（上昇）・陰遁（下降）サイクル
   * 陽遁: 冬至近くの甲子日から一白(1)で上昇 1→2→3→...→9→1→...
   * 陰遁: 夏至近くの甲子日から九紫(9)で下降 9→8→7→...→1→9→...
   */
  function getDayStar(date) {
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const year = target.getFullYear();
    const trans = getTransitions(year);

    const refTime = REF_KINOE_NE.getTime();
    const targetDays = Math.round((target.getTime() - refTime) / MS_PER_DAY);
    const intonDays = Math.round((trans.intonStart.getTime() - refTime) / MS_PER_DAY);
    const nextYoutonDays = Math.round((trans.nextYoutonStart.getTime() - refTime) / MS_PER_DAY);

    if (targetDays >= intonDays && targetDays < nextYoutonDays) {
      // 陰遁: 九紫(9)から下降
      const days = targetDays - intonDays;
      let star = 9 - (days % 9);
      if (star <= 0) star += 9;
      return star;
    } else {
      // 陽遁: 一白(1)から上昇
      let youtonDays = Math.round((trans.youtonStart.getTime() - refTime) / MS_PER_DAY);
      let days = targetDays - youtonDays;
      // 年末（次の陽遁開始後）の場合
      if (days < 0) {
        const prevTrans = getTransitions(year - 1);
        youtonDays = Math.round((prevTrans.youtonStart.getTime() - refTime) / MS_PER_DAY);
        days = targetDays - youtonDays;
      }
      let star = (days % 9) + 1;
      if (star <= 0) star += 9;
      return star;
    }
  }

  /**
   * 中央星から九星配置を算出
   */
  function getStarPositions(centerStar) {
    const shift = centerStar - 5;
    const positions = {};

    for (let i = 0; i < 9; i++) {
      let star = BASE_POSITIONS[i] + shift;
      while (star <= 0) star += 9;
      while (star > 9) star -= 9;
      positions[DIR_KEYS[i]] = star;
    }
    return positions;
  }

  /**
   * 五黄殺の方位を取得（五黄が座す方位、中央の場合はなし）
   */
  function getGoousatsu(positions) {
    for (const [dir, star] of Object.entries(positions)) {
      if (star === 5 && dir !== 'C') return dir;
    }
    return null; // 中央に五黄 = 五黄殺なし
  }

  /**
   * 暗剣殺の方位を取得（五黄殺の反対方位）
   */
  function getAnkensatsu(positions) {
    const goou = getGoousatsu(positions);
    if (!goou) return null;
    return OPPOSITE_DIR[goou];
  }

  /**
   * 歳破の方位を取得（年支の反対方位）
   */
  function getSaiha(date) {
    const year = getKigakuYear(date);
    // 年支: (year - 4) % 12 → 十二支のindex
    const branchIndex = (year - 4) % 12;
    const branch = BRANCHES[branchIndex];
    const dir = BRANCH_TO_DIR[branch];
    return { direction: OPPOSITE_DIR[dir], branch };
  }

  /**
   * 月破の方位を取得
   */
  function getGeppa(date) {
    const { month } = getKigakuMonth(date);
    // 月支: 1月=丑, 2月=寅, 3月=卯, ...
    const monthBranches = ['丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子'];
    const branch = monthBranches[month - 1];
    const dir = BRANCH_TO_DIR[branch];
    return { direction: OPPOSITE_DIR[dir], branch };
  }

  /**
   * 指定日の全方位情報を取得
   */
  function getDayInfo(date) {
    const yearStar = getYearStar(date);
    const monthStar = getMonthStar(date);
    const dayStar = getDayStar(date);

    const yearPositions = getStarPositions(yearStar);
    const monthPositions = getStarPositions(monthStar);
    const dayPositions = getStarPositions(dayStar);

    const yearGoou = getGoousatsu(yearPositions);
    const yearAnken = getAnkensatsu(yearPositions);
    const monthGoou = getGoousatsu(monthPositions);
    const monthAnken = getAnkensatsu(monthPositions);
    const dayGoou = getGoousatsu(dayPositions);
    const dayAnken = getAnkensatsu(dayPositions);

    const saiha = getSaiha(date);
    const geppa = getGeppa(date);

    return {
      date,
      year: {
        star: yearStar,
        positions: yearPositions,
        goousatsu: yearGoou,
        ankensatsu: yearAnken,
        saiha: saiha.direction,
      },
      month: {
        star: monthStar,
        positions: monthPositions,
        goousatsu: monthGoou,
        ankensatsu: monthAnken,
        geppa: geppa.direction,
      },
      day: {
        star: dayStar,
        positions: dayPositions,
        goousatsu: dayGoou,
        ankensatsu: dayAnken,
      },
      kigakuYear: getKigakuYear(date),
      kigakuMonth: getKigakuMonth(date),
    };
  }

  /**
   * 方位の凶判定
   * 返り値: 凶の種類の配列 (例: ['年五黄殺', '月暗剣殺'])
   */
  function getDirectionWarnings(dirKey, dayInfo) {
    const warnings = [];

    if (dayInfo.year.goousatsu === dirKey) warnings.push('年五黄殺');
    if (dayInfo.year.ankensatsu === dirKey) warnings.push('年暗剣殺');
    if (dayInfo.year.saiha === dirKey) warnings.push('歳破');
    if (dayInfo.month.goousatsu === dirKey) warnings.push('月五黄殺');
    if (dayInfo.month.ankensatsu === dirKey) warnings.push('月暗剣殺');
    if (dayInfo.month.geppa === dirKey) warnings.push('月破');
    if (dayInfo.day.goousatsu === dirKey) warnings.push('日五黄殺');
    if (dayInfo.day.ankensatsu === dirKey) warnings.push('日暗剣殺');

    return warnings;
  }

  /**
   * 角度から方位キーを取得（30°/60°方式）
   */
  function angleToDirKey(angle) {
    // 0° = 北, 時計回り
    angle = ((angle % 360) + 360) % 360;

    if (angle >= 345 || angle < 15) return 'N';
    if (angle >= 15 && angle < 75) return 'NE';
    if (angle >= 75 && angle < 105) return 'E';
    if (angle >= 105 && angle < 165) return 'SE';
    if (angle >= 165 && angle < 195) return 'S';
    if (angle >= 195 && angle < 255) return 'SW';
    if (angle >= 255 && angle < 285) return 'W';
    if (angle >= 285 && angle < 345) return 'NW';
    return 'N';
  }

  /**
   * 2点間の方位角を算出（度数法、北=0°、時計回り）
   */
  function calcBearing(lat1, lng1, lat2, lng2) {
    const toRad = Math.PI / 180;
    const dLng = (lng2 - lng1) * toRad;
    const lat1R = lat1 * toRad;
    const lat2R = lat2 * toRad;

    const y = Math.sin(dLng) * Math.cos(lat2R);
    const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLng);
    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    return (bearing + 360) % 360;
  }

  /**
   * 月日で五黄殺・暗剣殺が重なる方位があるかチェック
   */
  function getDoubleWarnings(dayInfo) {
    const doubles = [];
    const allDirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    for (const dir of allDirs) {
      const monthBad = (dayInfo.month.goousatsu === dir || dayInfo.month.ankensatsu === dir);
      const dayBad = (dayInfo.day.goousatsu === dir || dayInfo.day.ankensatsu === dir);
      if (monthBad && dayBad) {
        doubles.push(dir);
      }
    }
    return doubles;
  }

  /**
   * 相生相剋テーブル
   * 各本命星に対して、生気(大吉)・比和(中吉)・退気(吉)・死気(凶)・殺気(大凶)の星を定義
   * 五黄(5)は本命星としては特別扱い、方位上では凶方位の対象
   */
  const COMPATIBILITY = {
    // star: { seiki(大吉), hiwa(中吉), taiki(吉), shiki(凶), sakki(大凶) }
    1: { seiki: [6,7], hiwa: [],  taiki: [3,4], shiki: [9],   sakki: [2,5,8] },
    2: { seiki: [9],   hiwa: [8], taiki: [6,7], shiki: [1],   sakki: [3,4]   },
    3: { seiki: [1],   hiwa: [4], taiki: [9],   shiki: [2,8], sakki: [6,7]   },
    4: { seiki: [1],   hiwa: [3], taiki: [9],   shiki: [2,8], sakki: [6,7]   },
    5: { seiki: [9],   hiwa: [2,8], taiki: [6,7], shiki: [1], sakki: [3,4]   },
    6: { seiki: [2,8], hiwa: [7], taiki: [1],   shiki: [9],   sakki: [3,4]   },
    7: { seiki: [2,8], hiwa: [6], taiki: [1],   shiki: [3,4], sakki: [9]     },
    8: { seiki: [9],   hiwa: [2], taiki: [6,7], shiki: [1],   sakki: [3,4]   },
    9: { seiki: [3,4], hiwa: [],  taiki: [2,8], shiki: [6,7], sakki: [1]     },
  };

  /**
   * ある星にとっての吉星リストを返す（生気+比和+退気）
   */
  function getLuckyStars(star) {
    const c = COMPATIBILITY[star];
    if (!c) return [];
    return [...c.seiki, ...c.hiwa, ...c.taiki];
  }

  /**
   * 吉方位判定（本命・月命の両方で判定）
   * @param {string} dirKey - 方位キー（'N','NE'等）
   * @param {object} dayInfo - getDayInfo()の結果
   * @param {number} honmei - 本命星（1-9）
   * @param {number} getsu - 月命星（1-9）
   * @returns {object} { level: 'best'|'good'|'fair'|'none'|'bad', honmeiLucky, getsuLucky, starInDir, warnings }
   *   best = 本命・月命の両方で吉（本当の吉方位）
   *   good = 本命のみ吉
   *   fair = 月命のみ吉（まずまず）
   *   none = 吉でも凶でもない
   *   bad  = 凶方位（五黄殺・暗剣殺等）
   */
  function getDirectionLuck(dirKey, dayInfo, honmei, getsu) {
    if (dirKey === 'C') return { level: 'none', honmeiLucky: false, getsuLucky: false, starInDir: 5, warnings: [] };

    const warnings = getDirectionWarnings(dirKey, dayInfo);

    // 日盤の当該方位にある星
    const starInDir = dayInfo.day.positions[dirKey];

    // 凶方位がある場合は bad
    if (warnings.length > 0) {
      return { level: 'bad', honmeiLucky: false, getsuLucky: false, starInDir, warnings };
    }

    // 自分の本命星・月命星が座る方位は使えない（本命殺・月命殺）
    if (starInDir === honmei || starInDir === getsu) {
      return { level: 'bad', honmeiLucky: false, getsuLucky: false, starInDir, warnings: [starInDir === honmei ? '本命殺' : '月命殺'] };
    }

    // 五黄が座る方位は既にwarningsでカバー済みだが念のため
    if (starInDir === 5) {
      return { level: 'bad', honmeiLucky: false, getsuLucky: false, starInDir, warnings: ['五黄殺'] };
    }

    const honmeiLucky = getLuckyStars(honmei).includes(starInDir);
    const getsuLucky = getLuckyStars(getsu).includes(starInDir);

    let level = 'none';
    if (honmeiLucky && getsuLucky) level = 'best';
    else if (honmeiLucky) level = 'good';
    else if (getsuLucky) level = 'fair';

    return { level, honmeiLucky, getsuLucky, starInDir, warnings };
  }

  // Public API
  return {
    STAR_NAMES,
    STAR_SHORT,
    STAR_COLORS,
    DIRECTIONS,
    DIR_KEYS,
    DIR_ANGLES,
    OPPOSITE_DIR,
    getYearStar,
    getMonthStar,
    getDayStar,
    getStarPositions,
    getGoousatsu,
    getAnkensatsu,
    getSaiha,
    getGeppa,
    getDayInfo,
    getDirectionWarnings,
    getDoubleWarnings,
    angleToDirKey,
    calcBearing,
    getKigakuYear,
    getKigakuMonth,
    COMPATIBILITY,
    getLuckyStars,
    getDirectionLuck,
  };
})();

if (typeof module !== 'undefined') module.exports = KuseiEngine;
