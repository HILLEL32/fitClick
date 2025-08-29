// src/features/wardrobe/EditClothingItem.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import '../../css/EditClothingItem.css';

// ===== עזר פשוט לניקוי/נרמול =====
function uniqCleanSimple(arr) {
  const out = [];
  for (let i = 0; i < (arr ? arr.length : 0); i++) {
    let v = arr[i];
    if (v == null) continue;
    v = String(v).trim().toLowerCase();
    if (!v) continue;
    if (!out.includes(v)) out.push(v);
  }
  return out;
}
function parseCommaListSimple(str) {
  if (!str) return [];
  return uniqCleanSimple(str.split(','));
}

// ===== אפשרויות =====
const TYPE_OPTIONS  = ['shirt','t-shirt','blouse','sweater','hoodie','jeans','pants','shorts','skirt','dress','tights','leggings','coat','jacket'];
const STYLE_OPTIONS = ['casual','sport','elegant','classic','street','boho','business','party'];
const COLOR_OPTIONS = ['black','white','gray','blue','red','green','yellow','pink','purple','beige','brown','orange','denim'];

export default function EditClothing({ open, onClose, item, onSaved }) {
  const initial = useMemo(() => ({
    type:   uniqCleanSimple(item?.type   || []),
    colors: uniqCleanSimple(item?.colors || []),
    style:  uniqCleanSimple(item?.style  || []),
  }), [item]);

  const [typeSelected,   setTypeSelected]   = useState(initial.type);
  const [typeCustom,     setTypeCustom]     = useState('');
  const [colorsSelected, setColorsSelected] = useState(initial.colors);
  const [colorsCustom,   setColorsCustom]   = useState('');
  const [styleSelected,  setStyleSelected]  = useState(initial.style);
  const [styleCustom,    setStyleCustom]    = useState('');
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    setTypeSelected(initial.type);   setTypeCustom('');
    setColorsSelected(initial.colors); setColorsCustom('');
    setStyleSelected(initial.style); setStyleCustom('');
  }, [initial, open]);

  const handleToggle = (value, list, setter) => {
    const v = String(value).toLowerCase();
    const normalized = list.map(x => String(x).toLowerCase());
    if (normalized.includes(v)) {
      setter(normalized.filter(x => x !== v));
    } else {
      setter(uniqCleanSimple([...normalized, v]));
    }
  };

  const handleSave = async () => {
    const types  = uniqCleanSimple([...typeSelected,   ...parseCommaListSimple(typeCustom)]);
    const colors = uniqCleanSimple([...colorsSelected, ...parseCommaListSimple(colorsCustom)]);
    const styles = uniqCleanSimple([...styleSelected,  ...parseCommaListSimple(styleCustom)]);

    setSaving(true);
    try {
      await updateDoc(doc(db, 'clothingItems', item.id), {
        type: types, colors, style: styles, updatedAt: serverTimestamp(),
      });
      onSaved?.({ ...item, type: types, colors, style: styles });
      onClose?.();
    } catch (e) {
      console.error('Failed to update item', e);
      alert('שמירה נכשלה. נסי שוב.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="ec-modal" role="dialog" aria-modal="true" dir="rtl">
      {/* רקע ובלובים */}
      <div className="ec-overlay" />
      <div className="ec-blobs" />

      {/* כרטיס הזכוכית */}
      <div className="ec-dialog glass-card">
        <header className="ec-header">
          <h5 className="ec-title">עריכת פריט</h5>
          <button className="btn btn-ghost-sm" onClick={onClose} aria-label="סגירה">✕</button>
        </header>

        {/* רק הגוף גולל */}
        <div className="ec-body">
          {/* TYPE */}
          <div className="ec-field">
            <label className="ec-label">סוג הבגד (בחר/י כמה שצריך)</label>
            <div className="ec-chips">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`chip chip--type ${typeSelected.includes(opt) ? 'is-active' : ''}`}
                  onClick={() => handleToggle(opt, typeSelected, setTypeSelected)}
                >{opt}</button>
              ))}
            </div>
            <input
              className="form-control fc-input ec-input"
              placeholder="או הוסיפ/י סוגים ידנית, בפסיקים  (jeans, tights...)"
              value={typeCustom}
              onChange={e => setTypeCustom(e.target.value)}
            />
            <div className="ec-help">אפשר לשלב: shorts + jeans/tights וכו'.</div>
          </div>

          {/* COLORS */}
          <div className="ec-field">
            <label className="ec-label">צבעים</label>
            <div className="ec-chips">
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`chip chip--color ${colorsSelected.includes(opt) ? 'is-active' : ''}`}
                  onClick={() => handleToggle(opt, colorsSelected, setColorsSelected)}
                >{opt}</button>
              ))}
            </div>
            <input
              className="form-control fc-input ec-input"
              placeholder="או הוסיפ/י ידנית, בפסיקים  (light-blue, cream)"
              value={colorsCustom}
              onChange={e => setColorsCustom(e.target.value)}
            />
          </div>

          {/* STYLE */}
          <div className="ec-field">
            <label className="ec-label">סגנון</label>
            <div className="ec-chips">
              {STYLE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`chip chip--style ${styleSelected.includes(opt) ? 'is-active' : ''}`}
                  onClick={() => handleToggle(opt, styleSelected, setStyleSelected)}
                >{opt}</button>
              ))}
            </div>
            <input
              className="form-control fc-input ec-input"
              placeholder="או הוסף/הוסיפי ידנית, בפסיקים  (vintage, minimal)"
              value={styleCustom}
              onChange={e => setStyleCustom(e.target.value)}
            />
          </div>
        </div>

        <footer className="ec-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>ביטול</button>
          <button className="btn btn-auth-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'שומר…' : 'שמירה'}
          </button>
        </footer>
      </div>
    </div>
  );
}
