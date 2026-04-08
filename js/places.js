/**
 * よく行く場所管理モジュール
 */
const PlacesManager = (() => {
  const STORAGE_KEY = 'kusei_places';
  const HOME_KEY = 'kusei_home';

  const DEFAULT_HOME = { lat: 34.4075, lng: 131.0119, name: '自宅（長門市油谷）' };

  function getHome() {
    const stored = localStorage.getItem(HOME_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    setHome(DEFAULT_HOME);
    return DEFAULT_HOME;
  }

  function setHome(home) {
    localStorage.setItem(HOME_KEY, JSON.stringify(home));
  }

  function getPlaces() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    // デフォルト: 大阪
    const defaults = [
      { id: 'osaka', name: '大阪（往診先）', lat: 34.6937, lng: 135.5023, address: '大阪市' }
    ];
    setPlaces(defaults);
    return defaults;
  }

  function setPlaces(places) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
  }

  function addPlace(place) {
    const places = getPlaces();
    place.id = 'place_' + Date.now();
    places.push(place);
    setPlaces(places);
    return place;
  }

  function removePlace(id) {
    let places = getPlaces();
    places = places.filter(p => p.id !== id);
    setPlaces(places);
  }

  function updatePlace(id, updates) {
    const places = getPlaces();
    const idx = places.findIndex(p => p.id === id);
    if (idx >= 0) {
      Object.assign(places[idx], updates);
      setPlaces(places);
    }
  }

  /**
   * 住所からジオコーディング（Nominatim API）
   */
  async function geocode(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=jp&limit=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'ja' }
    });
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
    }
    return null;
  }

  /**
   * 場所の方位情報を取得
   */
  function getPlaceDirection(place) {
    const home = getHome();
    const bearing = KuseiEngine.calcBearing(home.lat, home.lng, place.lat, place.lng);
    const dirKey = KuseiEngine.angleToDirKey(bearing);
    return { bearing, dirKey, dirName: KuseiEngine.DIRECTIONS[KuseiEngine.DIR_KEYS.indexOf(dirKey)] };
  }

  return { getHome, setHome, getPlaces, setPlaces, addPlace, removePlace, updatePlace, geocode, getPlaceDirection };
})();
