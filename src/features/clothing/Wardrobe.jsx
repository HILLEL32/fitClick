// src/features/wardrobe/Wardrobe.jsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import EditClothing from './EditClothing';
import ClothingAIUpload from './ClothingAIUpload';
import '../../css/Wardrobe.css';
import AiChat from '../../AI/AiChat';
import Stores from './Stores'

import { onAuthStateChanged } from 'firebase/auth';



function Typewriter({ lines = [], typingSpeed = 45, pause = 1200 }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    let mounted = true;
    let i = 0;
    const run = () => {
      const line = lines[idx % lines.length];
      if (!mounted) return;
      if (i <= line.length) {
        setText(line.slice(0, i));
        i += 1;
        setTimeout(run, typingSpeed);
      } else {
        setTimeout(() => {
          const erase = () => {
            if (!mounted) return;
            if (i >= 0) {
              setText(line.slice(0, i));
              i -= 2;
              setTimeout(erase, 18);
            } else {
              setIdx((p) => (p + 1) % lines.length);
            }
          };
          erase();
        }, pause);
      }
    };
    run();
    return () => { mounted = false; };
  }, [idx, lines, typingSpeed, pause]);

  return (
    <span className="tw">
      {text}
      <span className="tw-caret" />
    </span>
  );
}

function uniqCleanSimple(arr) {
  let result = [];
  for (let i = 0; i < (arr ? arr.length : 0); i++) {
    let value = arr[i];
    if (value == null) continue;
    value = String(value).trim();
    if (value === '') continue;
    value = value.toLowerCase();
    if (!result.includes(value)) result.push(value);
  }
  return result;
}

function normalizeItemFields(item) {
  return {
    ...item,
    type: uniqCleanSimple(item?.type || []),
    colors: uniqCleanSimple(item?.colors || []),
    style: uniqCleanSimple(item?.style || []),
  };
}

const TOP_KEYWORDS = [
  'shirt', 't-shirt', 'tee', 'top', 'blouse', 'button-down', 'camisole', 'sweater', 'hoodie',
  'חולצה', 'טי שירט', 'טישרט', 'טופ', 'מכופתרת', 'סוודר', "קפוצ'ון"
];
const BOTTOM_KEYWORDS = [
  'pants', 'trousers', 'jeans', 'slacks', 'skirt', 'shorts',
  'מכנס', 'מכנסיים', "ג'ינס", 'מכנסי בד', 'חצאית', 'שורטס'
];
const DRESS_KEYWORDS = ['dress', 'שמלה'];

const NEUTRAL_COLORS = [
  'black', 'white', 'gray', 'grey', 'beige', 'cream', 'navy', 'denim', 'brown', 'khaki',
  'שחור', 'לבן', 'אפור', 'בז', 'קרם', 'כחול כהה', "ג'ינס", 'חום', 'חאקי'
];

function itemIsOf(item, keywords) {
  const arr = item?.type || [];
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    for (let j = 0; j < keywords.length; j++) {
      if (v.includes(keywords[j])) return true;
    }
  }
  return false;
}
function isTop(item) { return itemIsOf(item, TOP_KEYWORDS); }
function isBottom(item) { return itemIsOf(item, BOTTOM_KEYWORDS); }
function isDress(item) { return itemIsOf(item, DRESS_KEYWORDS); }

function hasIntersection(a, b) {
  for (let i = 0; i < (a || []).length; i++) {
    for (let j = 0; j < (b || []).length; j++) {
      if (a[i] === b[j]) return true;
    }
  }
  return false;
}
function hasNeutral(colors) {
  for (let i = 0; i < (colors || []).length; i++) {
    if (NEUTRAL_COLORS.includes(colors[i])) return true;
  }
  return false;
}
function styleOverlapCount(a, b) {
  let count = 0;
  for (let i = 0; i < (a || []).length; i++) {
    for (let j = 0; j < (b || []).length; j++) {
      if (a[i] === b[j]) count++;
    }
  }
  return count;
}
function scoreMatch(base, candidate) {
  let score = 0;
  if (hasIntersection(base.colors, candidate.colors)) score += 2;
  if (hasNeutral(base.colors) || hasNeutral(candidate.colors)) score += 1;
  score += styleOverlapCount(base.style, candidate.style);
  return score;
}

export default function Wardrobe() {
  const navigate = useNavigate();

  const [sp] = useSearchParams();
  const uidFromUrl = sp.get('uid'); // אם מגיעים מהאדמין: /wardrobe?uid=XXXX

  const [viewerUid, setViewerUid] = useState(null);      // מי מחובר בפועל
  const [targetUid, setTargetUid] = useState(null);      // הארון שאנחנו טוענים
  const [accessErr, setAccessErr] = useState('');        // שגיאת הרשאות

  const [clothingItems, setClothingItems] = useState([]);
  const [selectedShirt, setSelectedShirt] = useState(null);
  const [selectedPants, setSelectedPants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [baseItem, setBaseItem] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const TYPE_TRANSLATION = {
  shirt: "חולצה",
  top: "חולצה",
  blouse: "חולצה",
  "t-shirt": "חולצה",
  tee: "חולצה",
  pants: "מכנסיים",
  jeans: "ג'ינס",
  skirt: "חצאית",
  dress: "שמלה",
  jacket: "ג'קט",
  coat: "מעיל",
  sweater: "סוודר",
  hoodie: "קפוצ'ון",
};

const COLOR_TRANSLATION = {
  white: "לבן",
  black: "שחור",
  gray: "אפור",
  grey: "אפור",
  blue: "כחול",
  pink: "ורוד",
  brown: "חום",
  beige: "בז'",
  green: "ירוק",
};

const STYLE_TRANSLATION = {
  elegant: "אלגנטי",
  casual: "יומיומי",
  sport: "ספורטיבי",
  formal: "רשמי",
};

function translateArray(arr, dict) {
  if (!Array.isArray(arr)) return [];
  return arr.map(v => dict[v] || v);
}




  // 1) Resolve target uid (admin override)
  //------------------------------------------------------------------------------------
  // useEffect(() => {
  //   const resolveTarget = async () => {
  //     setLoading(true);
  //     setAccessErr('');

  //     const user = auth.currentUser;
  //     if (!user) {
  //       setLoading(false);
  //       return;
  //     }

  //     setViewerUid(user.uid);

  //     // ברירת מחדל - הארון של המשתמש המחובר
  //     if (!uidFromUrl || uidFromUrl === user.uid) {
  //       setTargetUid(user.uid);
  //       return;
  //     }

  //     // אם יש uid שונה ב-URL -> רק אדמין יכול
  //     try {
  //       const meSnap = await getDoc(doc(db, 'users', user.uid));
  //       const role = meSnap.exists() ? (meSnap.data().role || 'user') : 'user';

  //       if (role !== 'admin') {
  //         setAccessErr('אין הרשאה לצפות בארון של משתמש אחר.');
  //         setTargetUid(null);
  //         setLoading(false);
  //         return;
  //       }

  //       setTargetUid(uidFromUrl);
  //     } catch (e) {
  //       console.error(e);
  //       setAccessErr('שגיאה בבדיקת הרשאות.');
  //       setTargetUid(null);
  //       setLoading(false);
  //     }
  //   };

  //   resolveTarget();
  // }, [uidFromUrl]);
  // ------------------------------------------------------------------------------------

  // 1) Resolve target uid (admin override)
  useEffect(() => {
    setLoading(true);
    setAccessErr('');

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setViewerUid(null);
        setTargetUid(null);
        setLoading(false);
        return;
      }

      setViewerUid(user.uid);

      // ברירת מחדל - הארון של המשתמש המחובר
      if (!uidFromUrl || uidFromUrl === user.uid) {
        setTargetUid(user.uid);
        setLoading(false);
        return;
      }

      // אם יש uid שונה ב-URL -> רק אדמין יכול
      try {
        const meSnap = await getDoc(doc(db, 'users', user.uid));
        const role = meSnap.exists() ? (meSnap.data().role || 'user') : 'user';

        if (role !== 'admin') {
          setAccessErr('אין הרשאה לצפות בארון של משתמש אחר.');
          setTargetUid(null);
          setLoading(false);
          return;
        }

        setTargetUid(uidFromUrl);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setAccessErr('שגיאה בבדיקת הרשאות.');
        setTargetUid(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, [uidFromUrl, db]);


  // 2) Load clothing items for targetUid
  useEffect(() => {
    const fetchClothingItems = async () => {
      if (!targetUid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const qRef = query(
          collection(db, 'clothingItems'),
          where('uid', '==', targetUid)
        );

        const querySnapshot = await getDocs(qRef);
        const items = [];
        for (let i = 0; i < querySnapshot.docs.length; i++) {
          const d = querySnapshot.docs[i];
          items.push(normalizeItemFields({ id: d.id, ...d.data() }));
        }

        setClothingItems(items);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchClothingItems();
  }, [targetUid, db]);

  // const getImageDataUrl = (item) => (item?.imageId ? localStorage.getItem(item.imageId) : null);
  const getImageDataUrl = (item) => {
    if (item?.imageUrl) return item.imageUrl;
    if (item?.imageId) return localStorage.getItem(item.imageId);
    return null;
  };

  const handleDelete = async (item) => {
    if (!item?.id) return;
    const ok = window.confirm('למחוק את הפריט מהארון? אי אפשר לבטל.');
    if (!ok) return;

    try {
      setDeletingId(item.id);
      await deleteDoc(doc(db, 'clothingItems', item.id));
      if (item.imageId) localStorage.removeItem(item.imageId);

      setClothingItems((prev) => prev.filter(x => x.id !== item.id));
      setSelectedShirt((s) => (s?.id === item.id ? null : s));
      setSelectedPants((p) => (p?.id === item.id ? null : p));

      if (baseItem?.id === item.id) {
        setBaseItem(null);
        setRecommendations([]);
      } else {
        setRecommendations((prev) => prev.filter(r => r?.item?.id !== item.id));
      }
    } catch (err) {
      console.error('Delete item failed:', err);
      alert('מחיקה נכשלה. נסה שוב.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEdit = (item) => { setEditItem(item); setEditOpen(true); };

  const handleSavedEdit = (updated) => {
    const norm = normalizeItemFields(updated);
    setClothingItems((prev) => prev.map(x => x.id === norm.id ? norm : x));
    setSelectedShirt((s) => (s?.id === norm.id ? norm : s));
    setSelectedPants((p) => (p?.id === norm.id ? norm : p));
    if (baseItem?.id === norm.id) setBaseItem(norm);
  };

  const buildRecommendations = (base) => {
    const wantBottoms = isTop(base);
    const wantTops = isBottom(base);
    if (isDress(base)) return [];

    const recs = [];
    for (let i = 0; i < clothingItems.length; i++) {
      const cand = clothingItems[i];
      if (!cand?.id || cand.id === base.id) continue;
      if (wantBottoms && !isBottom(cand)) continue;
      if (wantTops && !isTop(cand)) continue;
      recs.push({ item: cand, score: scoreMatch(base, cand) });
    }
    recs.sort((a, b) => b.score - a.score);
    return recs.slice(0, 6);
  };

  const handleFindMatches = (item) => {
    setBaseItem(item);
    setRecommendations(buildRecommendations(item));
  };

  const handleChooseLook = (cand) => {
    const base = baseItem;
    if (!base || !cand) return;
    if (isTop(base) && isBottom(cand)) { setSelectedShirt(base); setSelectedPants(cand); }
    else if (isBottom(base) && isTop(cand)) { setSelectedShirt(cand); setSelectedPants(base); }
    else {
      if (isTop(cand)) setSelectedShirt(cand);
      if (isBottom(cand)) setSelectedPants(cand);
    }
  };

  if (loading)
    return <div className="container mt-5 text-center">טוען ארון...</div>;

  if (accessErr) {
    return (
      <div className="container mt-5 text-center" dir="rtl">
        <div style={{ color: "#b00", marginBottom: 12 }}>{accessErr}</div>
        <button className="btn btn-outline-secondary" type="button" onClick={() => navigate(-1)}>
          חזרה
        </button>
      </div>
    );
  }

  const viewingOtherUser = !!uidFromUrl && !!viewerUid && uidFromUrl !== viewerUid;

  return (
    <div className="wardrobe-wrapper" dir="rtl">
      <Stores />
      <div className="container">
        <h2 className="wardrobe-heading text-center mb-4">
          {viewingOtherUser ? 'ארון משתמש' : 'הארון שלי'}
        </h2>

        <div className="wardrobe-tips glass-card">
          <div className="tips-line">
            <Typewriter
              lines={[
                'שלבו טופ בהיר עם תחתון כהה למראה מאוזן ונקי.',
                'ניטרלי + צבע דומיננטי: תנו לפריט אחד “לדבר”.',
                'חום/בז משתלב מצוין עם ורוד פודרה או לבן שבור.',
                'אם יש לכם ג׳קט – נסו לוק של שכבות מעל טי-שירט.',
                'לוק ספורטיבי? לכו על נעל פשוטה בצבעים ניטרליים.',
                'אין מכנס מתאים? בקשו מה-AI לוק סביב החולצה שבחרתם.',
              ]}
              typingSpeed={45}
              pause={1200}
            />
          </div>
        </div>

        <div className="wardrobe-actions">
          <Link to="/app_home" className="btn btn-home-ghost">חזרה לדף הבית</Link>
          <Link to="/clothing_ai" className="btn btn-add">הוסף בגד לארון</Link>
        </div>

        <div className="ai-chat-clean-container">
          <AiChat />
        </div>

        {selectedShirt && (
          <div className="mb-4">
            <h4 className="h4-bop">חולצה שנבחרה:</h4>
            <img src={getImageDataUrl(selectedShirt)} alt="חולצה" className="selected-img" />
          </div>
        )}
        {selectedPants && (
          <div className="mb-4">
            <h4 className="h4-bop">מכנס שנבחר:</h4>
            <img src={getImageDataUrl(selectedPants)} alt="מכנס" className="selected-img" />
          </div>
        )}

        {/* המלצות לפריט בסיס */}
        {baseItem && (
          <>
            <h4 className="mb-3 h4-bop">המלצות עבור: </h4>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div>
                <strong>פריט בסיס</strong>
                <div className="mt-2">
                  {getImageDataUrl(baseItem) ? (
                    <img
                      src={getImageDataUrl(baseItem)}
                      alt="פריט בסיס"
                      className="selected-img"
                      style={{ maxWidth: 160 }}
                    />
                  ) : <span className="text-muted">תמונה לא זמינה</span>}
                </div>
              </div>
              <div className="ms-auto">
                <button className="btn btn-outline-secondary"
                  onClick={() => { setBaseItem(null); setRecommendations([]); }}>
                  נקה המלצות
                </button>
              </div>
            </div>

            {recommendations.length === 0 ? (
              <div className="text-muted">לא נמצאו התאמות. נסו פריט אחר או עדכנו סוג/צבע/סגנון.</div>
            ) : (
              <div className="row">
                {recommendations.map((r) => {
                  const cand = r.item;
                  const url = getImageDataUrl(cand);
                  return (
                    <div className="col-sm-6 col-md-4 mb-3" key={cand.id}>
                      <div className="wardrobe-card h-100">
                        {url ? (
                          <img src={url} className="wardrobe-card-img" alt="התאמה" />
                        ) : (
                          <div className="wardrobe-card-fallback text-center text-muted">
                            תמונה לא זמינה
                          </div>
                        )}
                        <div className="card-body">
                          <div className="small text-muted mb-1">ציון: {r.score}</div>
                          <div><strong>סוג:</strong> {cand.type && cand.type.join(', ') || '—'}</div>
                          <div><strong>צבעים:</strong> {cand.colors && cand.colors.join(', ') || '—'}</div>
                          <div><strong>סגנון:</strong> {cand.style && cand.style.join(', ') || '—'}</div>
                        </div>
                        <div className="card-footer d-flex wardrobe-card-footer">
                          <button className="btn btn-edit" onClick={() => handleChooseLook(cand)}>
                            בחר כלוק
                          </button>
                          <button className="btn btn-outline-secondary ms-auto" onClick={() => handleOpenEdit(cand)}>
                            ערוך פריט
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* רשת כל הבגדים */}
        <div className="row">
          {clothingItems.map((item) => {
            const imageDataUrl = item.imageUrl;
            const isDeleting = deletingId === item.id;

            console.log("ITEM IMAGE URL:", item.imageUrl);

            return (
              <div className="col-md-4 mb-4" key={item.id}>
                <div className="wardrobe-card h-100">
                  {imageDataUrl ? (
                    <img src={imageDataUrl} className="wardrobe-card-img" alt="בגד" />
                  ) : (
                    <div className="wardrobe-card-fallback text-center text-muted">
                      תמונה לא זמינה
                    </div>
                  )}

                  <div className="card-body">
                    <h5 className="card-title">
                      {/* <strong>סוג</strong>: {item.type && item.type.join(', ') || '—'} */}
                      <strong>סוג</strong>: {translateArray(item.type, TYPE_TRANSLATION).join(', ') || '—'}
                    </h5>
                    <p className="card-text"><strong>צבעים</strong> : {item.colors && item.colors.join(', ') || '—'}</p>
                    <p className="card-text"><strong>סגנון</strong> : {item.style && item.style.join(', ') || '—'}</p>
                  </div>

                  <div className="card-footer wardrobe-card-footer d-flex gap-2">
                    <Link
                      className="btn btn-outline-primary"
                      to={`/ai_chat?anchor=${encodeURIComponent(item.id)}`}
                      aria-label="בקש לוק סביב הפריט (AI)"
                    >
                      לוק סביב הפריט (AI)
                    </Link>

                    <button className="btn btn-edit" onClick={() => handleOpenEdit(item)}>
                      ערוך
                    </button>

                    <button
                      className="btn btn-delete ms-auto"
                      onClick={() => handleDelete(item)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'מוחק…' : 'מחק'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <EditClothing
          open={editOpen}
          onClose={() => setEditOpen(false)}
          item={editItem}
          onSaved={handleSavedEdit}
        />
      </div>
    </div>
  );
}
