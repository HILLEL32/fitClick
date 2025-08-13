// src/features/wardrobe/Wardrobe.jsx
import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import MatchingClothes from './MatchingClothes';

export default function Wardrobe() {
  const [clothingItems, setClothingItems] = useState([]);
  const [selectedShirt, setSelectedShirt] = useState(null);
  const [selectedPants, setSelectedPants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchClothingItems = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'clothingItems'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClothingItems(items);
      setLoading(false);
    };
    fetchClothingItems();
  }, []);

  const getImageDataUrl = (item) => (item?.imageId ? localStorage.getItem(item.imageId) : null);

  const handleDelete = async (item) => {
    if (!item?.id)
      return;
    const ok = window.confirm('למחוק את הפריט מהארון? אי אפשר לבטל.');
    if (!ok) 
      return;

    try {
      setDeletingId(item.id);
      // מחיקה מ־Firestore
      await deleteDoc(doc(db, 'clothingItems', item.id));
      // מחיקת התמונה המקומית (אם קיימת)
      if (item.imageId) localStorage.removeItem(item.imageId);
      // עדכון מצב מקומי
      setClothingItems((prev) => prev.filter((x) => x.id !== item.id));

      // אם מחקנו פריט שהיה מוצג כבחירה – ננקה את הבחירה
      setSelectedShirt((s) => (s?.id === item.id ? null : s));
      setSelectedPants((p) => (p?.id === item.id ? null : p));
    } catch (err) {
      console.error('Delete item failed:', err);
      alert('מחיקה נכשלה. נסה שוב.');
    } finally {
      setDeletingId(null);
    }
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

      <Link to="/app_home" className="btn btn-success mb-4"> HOME </Link>

      {/* תצוגת חולצה ומכנס שנבחרו */}
      {selectedShirt && (
        <div className="mb-4">
          <h4>חולצה שנבחרה:</h4>
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
                    <strong>סוג</strong>: {item.type?.join(', ') || '—'}
                  </h5>
                  <p className="card-text"><strong>צבעים</strong> : {item.colors?.join(', ') || '—'}</p>
                  <p className="card-text"><strong>סגנון</strong> : {item.style?.join(', ') || '—'}</p>
                </div>

                <div className="card-footer d-flex gap-2 bg-light">
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
    </div>
  );
}
