//src/features/wardrobe/Wardrobe.jsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
// import MatchingClothes from './MatchingClothes';
import EditClothing from './EditClothing';
import ClothingAIUpload from './ClothingAIUpload';
import '../../css/Wardrobe.css';
import GroqChat from '../../AI/GroqChat';
// import { askGroq } from '../../AI/askGroq';
import AiChat from '../../AI/AiChat';

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

// === עזר ידני: ניקוי ונרמול למטה-קייס בלי Set/map/filter מתקדמים ===
function uniqCleanSimple(arr) {
  let result = [];
  for (let i = 0; i < (arr ? arr.length : 0); i++) {
    let value = arr[i];
    if (value == null) continue;
    value = String(value).trim();
    if (value === '') continue;
    value = value.toLowerCase(); // נרמול
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
// ===================================================================

// === NEW: מזהי סוגים/צבעים בסיסיים להתאמה ===
const TOP_KEYWORDS = [
  'shirt', 't-shirt', 'tee', 'top', 'blouse', 'button-down', 'camisole', 'sweater', 'hoodie',
  'חולצה', 'טי שירט', 'טישרט', 'טופ', 'מכופתרת', 'סוודר', 'קפוצ\'ון'
];
const BOTTOM_KEYWORDS = [
  'pants', 'trousers', 'jeans', 'slacks', 'skirt', 'shorts',
  'מכנס', 'מכנסיים', 'ג\'ינס', 'מכנסי בד', 'חצאית', 'שורטס'
];
const DRESS_KEYWORDS = ['dress', 'שמלה'];

const NEUTRAL_COLORS = [
  // EN
  'black', 'white', 'gray', 'grey', 'beige', 'cream', 'navy', 'denim', 'brown', 'khaki',
  // HE
  'שחור', 'לבן', 'אפור', 'בז', 'קרם', 'כחול כהה', 'ג\'ינס', 'חום', 'חאקי'
];

// בדיקת שייכות סוג
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

// התאמת צבעים: שיתוף צבע, או אחד מהם ניטרלי
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

// ציון התאמה בסיסי: צבעים + ניטרליות + חפיפת סגנון
function scoreMatch(base, candidate) {
  let score = 0;
  if (hasIntersection(base.colors, candidate.colors)) score += 2;
  if (hasNeutral(base.colors) || hasNeutral(candidate.colors)) score += 1;
  score += styleOverlapCount(base.style, candidate.style); // כל חפיפה = +1
  return score;
}

export default function Wardrobe() {
  const [clothingItems, setClothingItems] = useState([]);
  const [selectedShirt, setSelectedShirt] = useState(null);
  const [selectedPants, setSelectedPants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // למודאל העריכה
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // === NEW: סט בסיס והמלצות
  const [baseItem, setBaseItem] = useState(null);
  const [recommendations, setRecommendations] = useState([]); // [{item, score}]

  useEffect(() => {
    const fetchClothingItems = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'clothingItems'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const items = [];
      for (let i = 0; i < querySnapshot.docs.length; i++) {
        const d = querySnapshot.docs[i];
        items.push(normalizeItemFields({ id: d.id, ...d.data() }));
      }
      setClothingItems(items);
      setLoading(false);
    };
    fetchClothingItems();
  }, []);

  const getImageDataUrl = (item) => (item?.imageId ? localStorage.getItem(item.imageId) : null);

  const handleDelete = async (item) => {
    if (!item?.id) return;
    const ok = window.confirm('למחוק את הפריט מהארון? אי אפשר לבטל.');
    if (!ok) return;

    try {
      setDeletingId(item.id);
      await deleteDoc(doc(db, 'clothingItems', item.id));
      if (item.imageId) localStorage.removeItem(item.imageId);

      setClothingItems((prev) => {
        const next = [];
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].id !== item.id) next.push(prev[i]);
        }
        return next;
      });

      setSelectedShirt((s) => (s?.id === item.id ? null : s));
      setSelectedPants((p) => (p?.id === item.id ? null : p));

      // איפוס המלצות אם מחקנו את הבסיס/מועמד
      if (baseItem?.id === item.id) {
        setBaseItem(null);
        setRecommendations([]);
      } else {
        // הסר מועמדים שנמחקו
        const filtered = [];
        for (let k = 0; k < recommendations.length; k++) {
          if (recommendations[k]?.item?.id !== item.id) filtered.push(recommendations[k]);
        }
        setRecommendations(filtered);
      }
    } catch (err) {
      console.error('Delete item failed:', err);
      alert('מחיקה נכשלה. נסה שוב.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setEditOpen(true);
  };

  const handleSavedEdit = (updated) => {
    // נרמול גם אחרי שמירה, כדי לשמור על עקביות
    const norm = normalizeItemFields(updated);

    setClothingItems((prev) => {
      const next = [];
      for (let i = 0; i < prev.length; i++) {
        next.push(prev[i].id === norm.id ? norm : prev[i]);
      }
      return next;
    });

    setSelectedShirt((s) => (s?.id === norm.id ? norm : s));
    setSelectedPants((p) => (p?.id === norm.id ? norm : p));

    if (baseItem?.id === norm.id) {
      setBaseItem(norm);
    }
  };

  // === NEW: בניית התאמות עבור פריט בסיס
  const buildRecommendations = (base) => {
    const wantBottoms = isTop(base);
    const wantTops = isBottom(base);
    if (isDress(base)) {
      // לעת עתה לא ממליצים לזווג לשמלה (אפשר להרחיב בעתיד לז'קט/קרדיגן)
      return [];
    }

    const recs = [];
    for (let i = 0; i < clothingItems.length; i++) {
      const cand = clothingItems[i];
      if (!cand?.id || cand.id === base.id) continue;

      if (wantBottoms && !isBottom(cand)) continue;
      if (wantTops && !isTop(cand)) continue;

      const sc = scoreMatch(base, cand);
      // אפשר סף מינימלי קטן כדי לסנן רעשים; נשאיר 0 ומעלה
      recs.push({ item: cand, score: sc });
    }

    // מיון יורד לפי ציון
    for (let i = 0; i < recs.length - 1; i++) {
      for (let j = i + 1; j < recs.length; j++) {
        if (recs[j].score > recs[i].score) {
          const tmp = recs[i]; recs[i] = recs[j]; recs[j] = tmp;
        }
      }
    }

    // נחזיר עד 6 ראשונים
    const top = [];
    const max = recs.length < 6 ? recs.length : 6;
    for (let k = 0; k < max; k++) top.push(recs[k]);
    return top;
  };

  // לחיצה על "מצא התאמות"
  const handleFindMatches = (item) => {
    setBaseItem(item);
    const recs = buildRecommendations(item);
    setRecommendations(recs);
  };

  // לחיצה על "בחר כלוק" מתוך ההמלצות – מגדירה חולצה/מכנס בהתאם לסוגי הבסיס/מועמד
  const handleChooseLook = (cand) => {
    const base = baseItem;
    if (!base || !cand) return;

    if (isTop(base) && isBottom(cand)) {
      setSelectedShirt(base);
      setSelectedPants(cand);
    } else if (isBottom(base) && isTop(cand)) {
      setSelectedShirt(cand);
      setSelectedPants(base);
    } else {
      // fallback: אם שניהם tops/bottoms, רק נסמן אחד
      if (isTop(cand)) setSelectedShirt(cand);
      if (isBottom(cand)) setSelectedPants(cand);
    }
    // אפשר להשאיר את תיבת ההמלצות פתוחה כדי לנסות שילובים נוספים
  };

  if (loading)
    return <div className="container mt-5 text-center">טוען ארון...</div>;

  return (
    <div className="container wardrobe-wrapper" dir="rtl">
      <h2 className="wardrobe-heading text-center mb-4">הארון שלי</h2>
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
      </div> <br/>

      {/* <MatchingClothes
        clothingItems={clothingItems}
        onSelectShirt={setSelectedShirt}
        onSelectPants={setSelectedPants}
      /> */}

      <div className="wardrobe-actions">
        <Link to="/app_home" className="btn btn-home-ghost">חזרה לדף הבית</Link>
        <Link to="/clothing_ai" className="btn btn-add">הוסף בגד לארון</Link>
        {/* <askGroq /> */}
        <AiChat />
      </div>

      {/* תצוגת חולצה ומכנס שנבחרו */}
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

      {/* === NEW: אזור ההמלצות לפי פריט שנבחר === */}
      {baseItem && (
        <div className="card p-3 mb-4 rec-card">
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
                    <div className="card h-100 wardrobe-card">
                      {url ? (
                        <img src={url} className="card-img-top wardrobe-card-img" alt="התאמה" />
                      ) : (
                        <div className="card-img-top wardrobe-card-fallback text-center text-muted">
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
        </div>
      )}

      {/* רשת כל הבגדים */}
      <div className="row">
        {clothingItems.map((item) => {
          const imageDataUrl = getImageDataUrl(item);
          const isDeleting = deletingId === item.id;

          return (
            <div className="col-md-4 mb-4" key={item.id}>
              <div className="card wardrobe-card h-100">
                {imageDataUrl ? (
                  <img
                    src={imageDataUrl}
                    className="card-img-top wardrobe-card-img"
                    alt="בגד"
                  />
                ) : (
                  <div className="card-img-top wardrobe-card-fallback text-center text-muted">
                    תמונה לא זמינה
                  </div>
                )}

                <div className="card-body">
                  <h5 className="card-title">
                    <strong>סוג</strong>: {item.type && item.type.join(', ') || '—'}
                  </h5>
                  <p className="card-text"><strong>צבעים</strong> : {item.colors && item.colors.join(', ') || '—'}</p>
                  <p className="card-text"><strong>סגנון</strong> : {item.style && item.style.join(', ') || '—'}</p>
                </div>

                {/* === NEW: כפתור מצא התאמות לפריט ספציפי === */}
                <div className="card-footer wardrobe-card-footer d-flex gap-2">
                  {/* <button
                    className="btn btn-primary"
                    onClick={() => handleFindMatches(item)}
                    aria-label="מצא התאמות לפריט זה"
                  >
                    מצא התאמות
                  </button> */}

                  <Link
                    className="btn btn-outline-primary"
                    to={`/ai_chat?anchor=${encodeURIComponent(item.id)}`}
                    aria-label="בקש לוק סביב הפריט (AI)"
                  >
                    בקש/י לוק סביב הפריט (AI)
                  </Link>

                  <button
                    className="btn btn-edit"
                    onClick={() => handleOpenEdit(item)}
                    aria-label="עריכת פריט"
                  >
                    ערוך
                  </button>

                  <button
                    className="btn btn-delete ms-auto"
                    onClick={() => handleDelete(item)}
                    disabled={isDeleting}
                    aria-label="מחיקת פריט"
                  >
                    {isDeleting ? 'מוחק…' : 'מחק'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* מודאל עריכה */}
      <EditClothing
        open={editOpen}
        onClose={() => setEditOpen(false)}
        item={editItem}
        onSaved={handleSavedEdit}
      />
    </div>
  );
}
