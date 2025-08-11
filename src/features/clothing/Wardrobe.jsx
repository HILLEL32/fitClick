import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import MatchingClothes from './MatchingClothes';


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
      <MatchingClothes />
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
                    <h5 className="card-title"><strong>סוג</strong>: {item.type?.join(', ') || "לא זוהה"}</h5>
                    <p className="card-text"><strong>צבעים</strong>: {item.colors?.join(', ') || "—"}</p>
                    <p className="card-text"><strong>סגנון</strong>: {item.style?.join(', ') || "—"}</p>
                    <p className="card-text"><strong>פרטים</strong>: {item.details?.join(', ') || "—"}</p>
                    <p className="card-text"><strong>אורך:</strong> {item.length?.join(', ') || "—"}</p>
                    <p className="card-text"><strong>קו מותן:</strong>: {item.waistline?.join(', ') || "—"}</p>
                    <p className="card-text text-muted">
                      תאריך: {item.createdAt?.toDate().toLocaleString() || "—"}
                    </p>
                  </div>
                </div>
                <Link to="/app_home" className="btn btn-success btn-lg floating-button">
                  back to home
                </Link>

              </div>
            );
          })}
        </div>

      )}
    </div>
  );
}
