import { useState, useEffect } from 'react';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from './api';
import './App.css';

const XP_MAP = { easy: 50, normal: 100, hard: 200 };
const ICONS = { easy: '🌿', normal: '⚔️', hard: '🔥' };
const RANKS = { easy: 'EASY', normal: 'NORMAL', hard: 'HARD' };
const TITLES = [
  [20, '신화 속 존재'], [12, '전설의 영웅'], [8, '정예 용사'],
  [5, '숙련 전사'], [3, '견습 기사'], [1, '새내기 모험가'],
];

function getTitle(lv) {
  return (TITLES.find(([min]) => lv >= min) || TITLES[TITLES.length - 1])[1];
}
function calcLevel(xp) { return Math.floor(xp / 300) + 1; }
function calcXpInLevel(xp) { return xp % 300; }

export default function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [diff, setDiff] = useState('normal');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shake, setShake] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDiff, setEditDiff] = useState('normal');
  const [levelModal, setLevelModal] = useState(null);
  const [animIds, setAnimIds] = useState({});

  const [diffs, setDiffs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('q-diffs') || '{}'); }
    catch { return {}; }
  });
  const [xp, setXp] = useState(() =>
    parseInt(localStorage.getItem('q-xp') || '0')
  );

  const level = calcLevel(xp);
  const xpInLevel = calcXpInLevel(xp);
  const xpPct = Math.round((xpInLevel / 300) * 100);
  const activeCount = todos.filter(t => !t.completed).length;
  const doneCount = todos.filter(t => t.completed).length;

  useEffect(() => { loadTodos(); }, []);
  useEffect(() => { localStorage.setItem('q-diffs', JSON.stringify(diffs)); }, [diffs]);
  useEffect(() => { localStorage.setItem('q-xp', xp.toString()); }, [xp]);

  async function loadTodos() {
    try {
      setLoading(true); setError(null);
      setTodos(await fetchTodos());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    const title = input.trim();
    if (!title) { setShake(true); setTimeout(() => setShake(false), 400); return; }
    try {
      const t = await createTodo(title);
      setDiffs(p => ({ ...p, [t._id]: diff }));
      setTodos(p => [t, ...p]);
      setInput('');
    } catch (e) { setError(e.message); }
  }

  async function handleComplete(todo) {
    if (todo.completed) return;
    setAnimIds(p => ({ ...p, [todo._id]: 'completing' }));
    setTimeout(async () => {
      try {
        const updated = await updateTodo(todo._id, { completed: true });
        const earned = XP_MAP[diffs[todo._id] || 'normal'];
        const prevLv = calcLevel(xp);
        const newXp = xp + earned;
        setXp(newXp);
        setTodos(p => p.map(t => t._id === updated._id ? updated : t));
        setAnimIds(p => { const n = { ...p }; delete n[todo._id]; return n; });
        if (calcLevel(newXp) > prevLv)
          setLevelModal({ level: calcLevel(newXp), title: getTitle(calcLevel(newXp)) });
      } catch (e) {
        setError(e.message);
        setAnimIds(p => { const n = { ...p }; delete n[todo._id]; return n; });
      }
    }, 500);
  }

  async function handleDelete(id) {
    setAnimIds(p => ({ ...p, [id]: 'deleting' }));
    setTimeout(async () => {
      try {
        await deleteTodo(id);
        setTodos(p => p.filter(t => t._id !== id));
        setDiffs(p => { const n = { ...p }; delete n[id]; return n; });
      } catch (e) { setError(e.message); }
      finally { setAnimIds(p => { const n = { ...p }; delete n[id]; return n; }); }
    }, 300);
  }

  function openEdit(todo) {
    setEditModal(todo);
    setEditText(todo.title);
    setEditDiff(diffs[todo._id] || 'normal');
  }

  async function handleEditSave() {
    const title = editText.trim();
    if (!title) return;
    try {
      const updated = await updateTodo(editModal._id, { title });
      setDiffs(p => ({ ...p, [editModal._id]: editDiff }));
      setTodos(p => p.map(t => t._id === updated._id ? updated : t));
      setEditModal(null);
    } catch (e) { setError(e.message); }
  }

  const filtered = todos.filter(t =>
    filter === 'active' ? !t.completed :
      filter === 'done' ? t.completed : true
  );

  return (
    <div className="container">

      {/* ── Title ── */}
      <div className="app-title">
        <h1>⚔ QUEST BOARD ⚔</h1>
        <p>할 일은 하고 살자</p>
      </div>

      {/* ── Player Card ── */}
      <div className="player-card">
        <div className="avatar">🧙</div>
        <div className="player-info">
          <div className="player-name-row">
            <span className="player-name">모험가</span>
            <span className="player-title-badge">{getTitle(level)}</span>
          </div>
          <div className="level-row">레벨 <span>{level}</span></div>
          <div className="exp-label-row">
            <span>EXP</span>
            <strong>{xpInLevel} / 300</strong>
          </div>
          <div className="exp-track">
            <div className="exp-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="stats-row">
            <div className="stat"><div className="stat-val">{todos.length}</div><div className="stat-lbl">전체</div></div>
            <div className="stat"><div className="stat-val">{activeCount}</div><div className="stat-lbl">진행중</div></div>
            <div className="stat"><div className="stat-val">{doneCount}</div><div className="stat-lbl">완료</div></div>
          </div>
        </div>
      </div>

      {/* ── Add Quest ── */}
      <div className="add-section">
        <div className="section-header">✦ NEW QUEST</div>
        <form className="input-row" onSubmit={handleAdd}>
          <input
            className={`quest-input${shake ? ' shake' : ''}`}
            placeholder="퀘스트 내용을 입력하세요..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <div className="diff-group">
            {['easy', 'normal', 'hard'].map(d => (
              <button key={d} type="button"
                className={`diff-btn ${d}${diff === d ? ' active' : ''}`}
                onClick={() => setDiff(d)}>
                {ICONS[d]} {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
              </button>
            ))}
          </div>
          <button className="add-btn" type="submit">수락</button>
        </form>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="error-box">
          {error}<button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="filters">
        {[['all', '전체'], ['active', '진행중'], ['done', '완료']].map(([v, l]) => (
          <button key={v} className={`filter-btn${filter === v ? ' active' : ''}`}
            onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      {/* ── Quest Grid ── */}
      {loading ? (
        <div className="empty"><div className="icon">⏳</div><p>퀘스트 불러오는 중...</p></div>
      ) : (
        <div className="quest-list">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="icon">📜</div>
              <p>퀘스트가 없어요. 새 퀘스트를 추가해봐요!</p>
            </div>
          ) : filtered.map(todo => {
            const d = diffs[todo._id] || 'normal';
            const anim = animIds[todo._id];
            return (
              <div key={todo._id}
                className={`quest-card ${d}${todo.completed ? ' completed' : ''}${anim ? ` ${anim}` : ''}`}>
                <div className="card-header">
                  <span className="card-rank">{RANKS[d]}</span>
                  <div className="card-actions">
                    {!todo.completed && (
                      <button className="edit-btn" onClick={() => openEdit(todo)} title="수정">✏</button>
                    )}
                    <button className="del-btn" onClick={() => handleDelete(todo._id)} title="삭제">✕</button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="card-icon-wrap">{ICONS[d]}</div>
                  <div className="card-target-label">OBJECTIVE</div>
                  <div className="quest-title">{todo.title}</div>
                </div>
                <div className="card-footer">
                  <div>
                    <div className="reward-label">REWARD</div>
                    <div className="reward-xp">+{XP_MAP[d]} XP</div>
                  </div>
                  {!todo.completed && (
                    <button className="card-complete-btn" onClick={() => handleComplete(todo)} title="완료">✓</button>
                  )}
                </div>
                {todo.completed && (
                  <div className="slayed-overlay"><span>CLEARED</span></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setEditModal(null)}>
          <div className="modal">
            <div className="modal-inner">
              <div className="modal-headline" style={{ fontSize: '22px', letterSpacing: '2px', marginBottom: '20px' }}>
                EDIT QUEST
              </div>
              <div className="edit-form">
                <input
                  className="quest-input edit-input"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditModal(null); }}
                  autoFocus
                />
                <div className="diff-group" style={{ justifyContent: 'center' }}>
                  {['easy', 'normal', 'hard'].map(d => (
                    <button key={d} type="button"
                      className={`diff-btn ${d}${editDiff === d ? ' active' : ''}`}
                      onClick={() => setEditDiff(d)}>
                      {ICONS[d]} {d === 'easy' ? '쉬움' : d === 'normal' ? '보통' : '어려움'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="edit-cancel-btn" onClick={() => setEditModal(null)}>취소</button>
                <button className="modal-ok" onClick={handleEditSave}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Level Up Modal ── */}
      {levelModal && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-inner">
              <span className="modal-icon">⭐</span>
              <div className="modal-headline">LEVEL UP!</div>
              <div className="modal-sub">새로운 경지에 도달했습니다</div>
              <div className="modal-level-box">
                <div className="modal-level-num">{levelModal.level}</div>
                <div className="modal-level-lbl">LEVEL</div>
                <div className="modal-title-txt">{levelModal.title}</div>
              </div>
              <button className="modal-ok" onClick={() => setLevelModal(null)}>계속하기</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
