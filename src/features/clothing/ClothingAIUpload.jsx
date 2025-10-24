// src/features/clothing/ClothingAIUpload.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { auth, db } from "../../firebase/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import '../../css/ClothingAIUpload.css';

const API_KEY = import.meta.env.VITE_LYKDAT_KEY;

// ===== תרגום אוטומטי עם Fallback =====
const TRANSLATE_URL = import.meta.env.VITE_TRANSLATE_URL || ''; // LibreTranslate (אופציונלי)
const TRANSLATE_KEY = import.meta.env.VITE_TRANSLATE_KEY || null;

const memCache = new Map();
const inFlight = new Map();
const loadLocalCache = () => {
  try { return JSON.parse(localStorage.getItem('he-translate-cache') || '{}'); }
  catch { return {}; }
};
const saveLocalCache = (obj) => {
  try { localStorage.setItem('he-translate-cache', JSON.stringify(obj)); } catch {}
};
let localCache = loadLocalCache();

async function providerLibreTranslate(q, target = 'he', source = 'auto') {
  if (!TRANSLATE_URL) throw new Error('no-libre-url');
  const res = await fetch(TRANSLATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, source, target, format: 'text', api_key: TRANSLATE_KEY || undefined })
  });
  if (!res.ok) throw new Error(`libre-http-${res.status}`);
  const data = await res.json();
  const t = data?.translatedText;
  if (!t) throw new Error('libre-no-text');
  return t;
}

async function providerMyMemory(q, target = 'he', source = 'en') {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`mymemory-http-${res.status}`);
  const data = await res.json();
  const t = data?.responseData?.translatedText || '';
  return t || q;
}

async function translateText(q, target = 'he', source = 'auto') {
  const key = `${source}->${target}::${q}`;
  if (memCache.has(key)) return memCache.get(key);
  if (localCache[key]) { memCache.set(key, localCache[key]); return localCache[key]; }
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    try {
      if (TRANSLATE_URL) {
        try {
          const t = await providerLibreTranslate(q, target, source);
          memCache.set(key, t); localCache[key] = t; saveLocalCache(localCache);
          return t;
        } catch {}
      }
      const t2 = await providerMyMemory(q, target, source === 'auto' ? 'en' : source);
      memCache.set(key, t2); localCache[key] = t2; saveLocalCache(localCache);
      return t2;
    } catch {
      return q; // fallback למקור (נחביא באנגלית בשכבת התצוגה)
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

async function translateList(list, target = 'he', source = 'auto') {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (arr.length === 0) return [];
  const SEP = '|||';
  const joined = arr.join(SEP);
  const translatedJoined = await translateText(joined, target, source);
  if (translatedJoined === joined) {
    const perItem = await Promise.all(arr.map(x => translateText(x, target, source)));
    return perItem;
  }
  return translatedJoined.split(SEP).map(s => s.trim());
}

export default function ClothingAIUpload() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // תוצאות מקור באנגלית (לשמירה וללוגיקה)
  const [result, setResult] = useState(null);

  // תוצאות מתורגמות לתצוגה בעברית בלבד
  const [resultHe, setResultHe] = useState(null);
  const [heReady, setHeReady] = useState(false); // מציגים רק כשזה true

  const [loading, setLoading] = useState(false);

  const [typedText, setTypedText] = useState("");
  const fullText = "העלה/י תמונה ברורה של הפריט, ותוך רגעים המערכת תזהה סוג, צבעים וסגנון — ותוסיף אותו לארון שלך.";
  const idxRef = useRef(0);

  useEffect(() => {
    setTypedText("");
    idxRef.current = 0;
    const interval = setInterval(() => {
      const i = idxRef.current;
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        idxRef.current = i + 1;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // תרגום שקט: לא מציגים תוצאות עד שהעברית מוכנה
  useEffect(() => {
    let mounted = true;
    const doTranslate = async () => {
      setHeReady(false);
      setResultHe(null);
      if (!result) return;
      try {
        const [typeHe, colorsHe, styleHe, detailsHe, lengthHe, waistlineHe] = await Promise.all([
          translateList(result.type, 'he', 'auto'),
          translateList(result.colors, 'he', 'auto'),
          translateList(result.style, 'he', 'auto'),
          translateList(result.details, 'he', 'auto'),
          translateList(result.length, 'he', 'auto'),
          translateList(result.waistline, 'he', 'auto'),
        ]);
        if (!mounted) return;
        setResultHe({
          type: typeHe, colors: colorsHe, style: styleHe,
          details: detailsHe, length: lengthHe, waistline: waistlineHe
        });
      } finally {
        if (mounted) setHeReady(true);
      }
    };
    doTranslate();
    return () => { mounted = false; };
  }, [result]);

  const resetSelection = (message) => {
    setImageFile(null);
    setPreviewUrl(null);
    setResult(null);
    setResultHe(null);
    setHeReady(false);
    if (message) alert(message);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setResultHe(null);
      setHeReady(false);
    }
  };

  const uploadToLykdat = async () => {
    if (!imageFile) return alert('בחרי תמונה קודם');
    setLoading(true);
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await axios.post(
        'https://cloudapi.lykdat.com/v1/detection/tags',
        formData,
        { headers: { 'x-api-key': API_KEY }, timeout: 30000 }
      );

      const data = response?.data?.data || {};
      const labels = data.labels || [];
      const items = data.items || [];
      const colors = data.colors || [];

      const extractLabels = (cat) =>
        labels.filter(l => l.classification === cat).map(l => l.name);

      const simplified = {
        type: [...new Set(items.filter(i => i.confidence > 0.6).map(i => i.name))],
        colors: colors.filter(c => c.confidence > 0.2).map(c => c.name),
        style: [...extractLabels("silhouette"), ...extractLabels("textile pattern")],
        details: [...extractLabels("garment parts"), ...extractLabels("opening type"), ...extractLabels("nickname")],
        length: extractLabels("length"),
        waistline: extractLabels("waistline")
      };

      // סינון מחמיר
      const strongItems = (items || []).filter(i => (i?.confidence ?? 0) >= 0.6);
      if (strongItems.length === 0) return resetSelection("נא לבחור בגד או פריט לבוש");

      const validClothingKeywords = [
        "shirt","t-shirt","top","blouse","dress","gown","skirt","pants","trousers","jeans",
        "shorts","coat","jacket","sweater","cardigan","hoodie","overcoat","suit","blazer",
        "vest","sweatshirt","tracksuit","legging","tights",
        "shoe","shoes","sneakers","boots","heels","sandals","flip-flops","bag","handbag","backpack","tote","purse",
        "sunglasses","glasses","eyeglasses","frames","earrings","necklace","bracelet","ring","jewelry","watch","brooch",
        "scarf","hat","cap","beanie","beret","belt","tie","bow tie","gloves",
        "חולצה","שמלה","חצאית","מכנס","מכנסיים","ג׳ינס","ג'ינס","מעיל","ז׳קט","סוודר","קרדיגן","קפוצ׳ון",
        "חליפה","וסט","טרנינג","טייץ","נעל","נעליים","סניקרס","מגפיים","סנדלים","תיק","שעון","עגילים","שרשרת","צעיף","כובע"
      ].map(x => x.toLowerCase());

      const isClothingKeyword = (name) =>
        validClothingKeywords.some(k => String(name || "").toLowerCase().includes(k));

      const clothingStrong = strongItems.filter(i => isClothingKeyword(i?.name));
      if (clothingStrong.length === 0) return resetSelection("אירעה שגיאה בזיהוי הבגד");
      if (clothingStrong.length !== 1) return resetSelection("יש להעלות פריט לבוש אחד בלבד בתמונה");

      setResult(simplified); // נשמר באנגלית, אך לא יוצג עד שתהיה עברית מוכנה
      await saveClothingLocallyAndToFirestore(imageFile, simplified);

    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e.message;
      console.error("API Error:", status, msg);

      if (status === 401 || status === 403) {
        alert("שגיאת הרשאה מול שירות הזיהוי. בדקי את מפתח ה-API.");
      } else if (status === 415) {
        alert("פורמט קובץ לא נתמך. נסי JPG/PNG בגודל סביר.");
      } else if (status === 429) {
        alert("חרגת ממגבלת הבקשות. נסי שוב מאוחר יותר.");
      } else if (status === 413) {
        alert("הקובץ גדול מדי. נסי תמונה קטנה יותר.");
      } else {
        alert("תקלה טכנית בזיהוי. נסי שוב מאוחר יותר.");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveClothingLocallyAndToFirestore = async (imageFile, metadata) => {
    const user = auth.currentUser;
    if (!user) return alert("המשתמש לא מחובר");

    const reader = new FileReader();
    const imageId = `img-${Date.now()}`;
    reader.onloadend = async () => {
      localStorage.setItem(imageId, reader.result);
      const clothingDoc = {
        uid: user.uid,
        imageId,
        type: metadata.type || ["בגד לא מזוהה"],
        colors: metadata.colors || [],
        style: metadata.style || [],
        details: metadata.details || [],
        length: metadata.length || [],
        waistline: metadata.waistline || [],
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "clothingItems"), clothingDoc);
      alert("הבגד נוסף לארון שלך (התמונה שמורה מקומית בלבד)");
    };
    reader.readAsDataURL(imageFile);
  };

  const renderList = (arr) => {
    const list = Array.isArray(arr) ? arr.filter(Boolean) : [];
    return list.length ? list.join(', ') : '—';
  };

  return (
    <div className="aiu-page" dir="rtl">
      {/* שכבות רקע */}
      <div className="aiu-overlay" />
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />

      <header className="container-xl aiu-hero">
        <h1 className="aiu-heading">העלאת בגד לזיהוי</h1>
        <p className="aiu-sub">{typedText}</p>
      </header>

      <main className="container-xl">
        <section className="aiu-card glass-card">
          <label className="form-label aiu-label">בחרי תמונה</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="form-control fc-input aiu-input"
          />

          {previewUrl && (
            <div className="aiu-preview">
              <img src={previewUrl} alt="תצוגת תמונה" className="aiu-preview-img" />
            </div>
          )}

          <div className="aiu-actions">
            <button
              className="btn btn-auth-primary"
              onClick={uploadToLykdat}
              disabled={loading || !imageFile}
            >
              {loading ? 'מזהה…' : 'זהה את הבגד'}
            </button>
            <Link to="/wardrobe" className="btn btn-ghost">מעבר לארון שלי</Link>
          </div>

          {/* מציגים תוצאות רק כשהעברית מוכנה */}
          {heReady && resultHe && (
            <div className="aiu-result">
              <h3 className="aiu-result-title">תוצאות זיהוי</h3>
              <ul className="aiu-list">
                <li><strong>סוג:</strong> {renderList(resultHe.type)}</li>
                <li><strong>צבעים:</strong> {renderList(resultHe.colors)}</li>
                <li><strong>סגנון:</strong> {renderList(resultHe.style)}</li>
                <li><strong>פרטים:</strong> {renderList(resultHe.details)}</li>
                <li><strong>אורך:</strong> {renderList(resultHe.length)}</li>
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
