/**
 * 家族管理モジュール
 */
const FamilyManager = (() => {
  const STORAGE_KEY = 'kusei_family';

  const DEFAULT_MEMBERS = [
    { id: 'self', name: '自分', honmei: 9, getsu: 7 },
    { id: 'wife', name: '妻', honmei: 8, getsu: 9 },
  ];

  function getMembers() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    setMembers(DEFAULT_MEMBERS);
    return DEFAULT_MEMBERS;
  }

  function setMembers(members) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }

  function addMember(member) {
    const members = getMembers();
    member.id = 'member_' + Date.now();
    members.push(member);
    setMembers(members);
    return member;
  }

  function removeMember(id) {
    let members = getMembers();
    members = members.filter(m => m.id !== id);
    setMembers(members);
  }

  function updateMember(id, updates) {
    const members = getMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx >= 0) {
      Object.assign(members[idx], updates);
      setMembers(members);
    }
  }

  function getActiveMember() {
    const activeId = localStorage.getItem('kusei_active_member') || 'self';
    const members = getMembers();
    return members.find(m => m.id === activeId) || members[0];
  }

  function setActiveMember(id) {
    localStorage.setItem('kusei_active_member', id);
  }

  return { getMembers, setMembers, addMember, removeMember, updateMember, getActiveMember, setActiveMember };
})();
