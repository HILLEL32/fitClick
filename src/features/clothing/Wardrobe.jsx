import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Wardrobe() {
  const [clothingItems, setClothingItems] = useState([]);

  useEffect(() => {
    const fetchClothingItems = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "clothingItems"),
        where("uid", "==", user.uid)
      );

      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setClothingItems(items);
    };

    fetchClothingItems();
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">הארון שלי </h2>

      {clothingItems.length === 0 ? (
        <p className="text-center">אין בגדים להצגה כרגע.</p>
      ) : (
        <div className="row">
          {clothingItems.map(item => {
            const imageDataUrl = localStorage.getItem(item.imageId);

            return (
              <div className="col-md-4 mb-4" key={item.id}>
                <div className="card h-100">
                  {imageDataUrl ? (
                    <img
                      src={imageDataUrl}
                      className="card-img-top"
                      alt="בגד"
                      style={{ height: '300px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="card-img-top text-center text-muted pt-5" style={{ height: '300px', background: '#f0f0f0' }}>
                      תמונה לא זמינה במכשיר זה
                    </div>
                  )}
                  <div className="card-body">
                    <h5 className="card-title">סוג: {item.type?.join(', ') || "לא זוהה"}</h5>
                    <p className="card-text">צבעים: {item.colors?.join(', ') || "—"}</p>
                    <p className="card-text">סגנון: {item.style?.join(', ') || "—"}</p>
                    <p className="card-text">פרטים: {item.details?.join(', ') || "—"}</p>
                    <p className="card-text">אורך: {item.length?.join(', ') || "—"}</p>
                    <p className="card-text">קו מותן: {item.waistline?.join(', ') || "—"}</p>
                    <p className="card-text text-muted">
                      תאריך: {item.createdAt?.toDate().toLocaleString() || "—"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
