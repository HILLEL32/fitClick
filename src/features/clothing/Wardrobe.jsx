// src/features/wardrobe/Wardrobe.jsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import MatchingClothes from './MatchingClothes';
import EditClothing from './EditClothing';
import ClothingAIUpload from './ClothingAIUpload';

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

export default function Wardrobe() {
  const [clothingItems, setClothingItems] = useState([]);
  const [selectedShirt, setSelectedShirt] = useState(null);
  const [selectedPants, setSelectedPants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // למודאל העריכה
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

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
  };

  if (loading)
    return <div className="container mt-5 text-center">טוען ארון...</div>;

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">הארון שלי</h2>

      <MatchingClothes
        clothingItems={clothingItems}
        onSelectShirt={setSelectedShirt}
        onSelectPants={setSelectedPants}
      />

      <Link to="/app_home" className="btn btn-success mb-4 me-2"> חזרה לדף הבית </Link> 
      <Link to="/clothing_ai" className="btn btn-success mb-4"> הוסף בגד לארון </Link>

      {/* תצוגת חולצה ומכנס שנבחרו */}
      {selectedShirt && (
        <div className="mb-4">
          <h4> חולצה שנבחרה:</h4>
          <img src={getImageDataUrl(selectedShirt)} alt="חולצה" style={{ maxHeight: 200 }} />
        </div>
      )}
      {selectedPants && (
        <div className="mb-4">
          <h4>מכנס שנבחר:</h4>
          <img src={getImageDataUrl(selectedPants)} alt="מכנס" style={{ maxHeight: 200 }} />
        </div>
      )}

      {/* רשת כל הבגדים */}
      <div className="row">
        {clothingItems.map((item) => {
          const imageDataUrl = getImageDataUrl(item);
          const isDeleting = deletingId === item.id;

          return (
            <div className="col-md-4 mb-4" key={item.id}>
              <div className="card h-100">
                {imageDataUrl ? (
                  <img
                    src={imageDataUrl}
                    className="card-img-top"
                    alt="בגד"
                    style={{ height: 300, objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="card-img-top text-center text-muted pt-5"
                    style={{ height: 300, background: '#f0f0f0' }}
                  >
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

                <div className="card-footer d-flex gap-2 bg-light">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => handleOpenEdit(item)}
                    aria-label="עריכת פריט"
                  >
                    ערוך
                  </button>

                  <button
                    className="btn btn-outline-danger ms-auto"
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
