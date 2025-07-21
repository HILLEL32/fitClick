import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';

export default function Wardrobe() {
    const [clothingItems, setClothingItems] = useState([]);

    useEffect(() => {
        const fetchClothing = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(
                collection(db, 'clothing'),
                where('uid', '==', user.uid)
            );

            const querySnapshot = await getDocs(q);
            const items = [];

            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });

            setClothingItems(items);
        };

        fetchClothing();
    }, []);

    const groupByType = (items) => {
        const grouped = {};
        items.forEach(item => {
            const typeKey = item.type && item.type.length > 0 ? item.type[0] : 'Uncategorized';
            if (!grouped[typeKey]) grouped[typeKey] = [];
            grouped[typeKey].push(item);
        });
        return grouped;
    };

    const groupedItems = groupByType(clothingItems);

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">👗 הארון שלי</h2>

            {Object.entries(groupedItems).map(([type, items]) => (
                <div key={type} className="mb-5">
                    <h4 className="text-primary">{type}</h4>
                    <div className="row">
                        {items.map((item) => (
                            <div className="col-md-3 mb-4" key={item.id}>
                                <div className="card">
                                    <img
                                        src={item.imageUrl}
                                        className="card-img-top"
                                        alt="בגד"
                                        style={{ height: '200px', objectFit: 'cover' }}
                                    />
                                    <div className="card-body">
                                        <p className="card-text">
                                            <strong>Colors:</strong> {item.colors.join(', ')}
                                        </p>
                                        <p className="card-text">
                                            <small className="text-muted">
                                                Added: {item.createdAt?.toDate().toLocaleDateString() || '---'}
                                            </small>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {clothingItems.length === 0 && (
                <p className="text-center text-muted mt-5">No clothes uploaded yet 🤷‍♀️</p>
            )}
        </div>
    );
}
