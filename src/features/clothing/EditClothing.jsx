// src/features/wardrobe/EditClothingItem.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

// ===== גרסאות ידניות ופשוטות =====
function uniqCleanSimple(arr) {
  let result = [];
  for (let i = 0; i < (arr ? arr.length : 0); i++) {
    let value = arr[i];
    if (value == null) continue;        // מדלג על null/undefined
    value = String(value).trim();       // ממיר למחרוזת ומוריד רווחים
    if (value === '') continue;         // מדלג על ריקים
    // נורמליזציה (רשות): לאותיות קטנות כדי לאחד "Jeans"/"jeans"
    value = value.toLowerCase();
    if (!result.includes(value)) {
      result.push(value);               // מוסיף רק אם לא קיים
    }
  }
  return result;
}

function parseCommaListSimple(str) {
  if (!str) return [];
  const parts = str.split(',');         // מפצל לפי פסיקים
  return uniqCleanSimple(parts);        // מנקה ומסיר כפילויות
}
// ==================================

const TYPE_OPTIONS = [
  'shirt','t-shirt','blouse','sweater','hoodie',
  'jeans','pants','shorts','skirt','dress','tights','leggings',
  'coat','jacket'
];

const STYLE_OPTIONS = [
  'casual','sport','elegant','classic','street','boho','business','party'
];

const COLOR_OPTIONS = [
  'black','white','gray','blue','red','green','yellow','pink','purple',
  'beige','brown','orange','denim'
];

export default function EditClothing({ open, onClose, item, onSaved }) {
  const initial = useMemo(() => ({
    type: uniqCleanSimple(item?.type || []),
    colors: uniqCleanSimple(item?.colors || []),
    style: uniqCleanSimple(item?.style || []),
  }), [item]);

  const [typeSelected, setTypeSelected] = useState(initial.type);
  const [typeCustom, setTypeCustom] = useState('');

  const [colorsSelected, setColorsSelected] = useState(initial.colors);
  const [colorsCustom, setColorsCustom] = useState('');

  const [styleSelected, setStyleSelected] = useState(initial.style);
  const [styleCustom, setStyleCustom] = useState('');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTypeSelected(initial.type);
    setTypeCustom('');
    setColorsSelected(initial.colors);
    setColorsCustom('');
    setStyleSelected(initial.style);
    setStyleCustom('');
  }, [initial, open]);

  const handleToggle = (value, list, setter) => {
    // נשמור/נסיר עם נורמליזציה לאותיות קטנות, כדי ש"SHORTS" ו"shorts" יהיו אותו דבר
    const v = String(value).toLowerCase();
    // בונים רשימה מנורמלת בלי להוסיף ספריות
    const normalized = [];
    for (let i = 0; i < list.length; i++) {
      normalized.push(String(list[i]).toLowerCase());
    }
    const exists = normalized.includes(v);
    if (exists) {
      // הסרה ידנית
      const next = [];
      for (let i = 0; i < normalized.length; i++) {
        if (normalized[i] !== v) next.push(normalized[i]);
      }
      setter(next);
    } else {
      // הוספה
      const next = normalized.slice();
      next.push(v);
      setter(uniqCleanSimple(next));
    }
  };

  const handleSave = async () => {
    // מאחדים בחירות + טקסט חופשי (פסיקים), ידנית ופשוט
    const types = uniqCleanSimple(
      (typeSelected || []).concat(parseCommaListSimple(typeCustom))
    );
    const colors = uniqCleanSimple(
      (colorsSelected || []).concat(parseCommaListSimple(colorsCustom))
    );
    const styles = uniqCleanSimple(
      (styleSelected || []).concat(parseCommaListSimple(styleCustom))
    );

    setSaving(true);
    try {
      const ref = doc(db, 'clothingItems', item.id);
      await updateDoc(ref, {
        type: types,
        colors,
        style: styles,
        updatedAt: serverTimestamp(),
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
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: 'rgba(0,0,0,0.35)', zIndex: 1050 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="container h-100 d-flex align-items-center justify-content-center">
        <div className="card shadow-lg" style={{ maxWidth: 720, width: '100%' }}>
          <div className="card-header d-flex align-items-center">
            <h5 className="mb-0">עריכת פריט</h5>
            <button
              className="btn btn-sm btn-outline-secondary ms-auto"
              onClick={onClose}
              aria-label="סגירה"
            >
              X
            </button>
          </div>

          <div className="card-body">
            {/* TYPE */}
            <div className="mb-3">
              <label className="form-label fw-bold">סוג הבגד (בחרי כמה שצריך)</label>
              <div className="d-flex flex-wrap gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`btn btn-sm ${typeSelected.includes(opt) ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => handleToggle(opt, typeSelected, setTypeSelected)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input
                className="form-control mt-2"
                placeholder="או הוסיפי סוגים ידנית, בפסיקים  (jeans, tights...)"
                value={typeCustom}
                onChange={e => setTypeCustom(e.target.value)}
              />
              <div className="form-text">אפשר לשלב: shorts + jeans/tights וכו'.</div>
            </div>

            {/* COLORS */}
            <div className="mb-3">
              <label className="form-label fw-bold">צבעים</label>
              <div className="d-flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`btn btn-sm ${colorsSelected.includes(opt) ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleToggle(opt, colorsSelected, setColorsSelected)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input
                className="form-control mt-2"
                placeholder="או הוסיפי ידנית, בפסיקים  (light-blue, cream)"
                value={colorsCustom}
                onChange={e => setColorsCustom(e.target.value)}
              />
            </div>

            {/* STYLE */}
            <div className="mb-3">
              <label className="form-label fw-bold">סגנון</label>
              <div className="d-flex flex-wrap gap-2">
                {STYLE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    className={`btn btn-sm ${styleSelected.includes(opt) ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => handleToggle(opt, styleSelected, setStyleSelected)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input
                className="form-control mt-2"
                placeholder="או הוסיפי ידנית, בפסיקים  (vintage, minimal)"
                value={styleCustom}
                onChange={e => setStyleCustom(e.target.value)}
              />
            </div>
          </div>

          <div className="card-footer d-flex gap-2">
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
              ביטול
            </button>
            <button className="btn btn-success ms-auto" onClick={handleSave} disabled={saving}>
              {saving ? 'שומר…' : 'שמירה'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
