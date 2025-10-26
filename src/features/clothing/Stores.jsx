import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../css/Stores.css";

// לוגואים מתוך src/photos
import zaraLogo from "../../photos/zara.png";
import mangoLogo from "../../photos/mango.jpeg";
import castroLogo from "../../photos/castro.svg";
import tamnoonLogo from "../../photos/tamnoon.png";
import sheinLogo from "../../photos/shein.jpeg";
import renuarLogo from "../../photos/renuar.png";
import placeholderImg from "../../photos/man.png"; // פלייסהולדר

const BRANDS = [
  { name: "ZARA", url: "https://www.zara.com", logo: zaraLogo },
  { name: "MANGO", url: "https://shop.mango.com", logo: mangoLogo },
  { name: "CASTRO", url: "https://www.castro.com", logo: castroLogo },
  { name: "TAMNOON", url: "https://www.tamnoon.co.il", logo: tamnoonLogo },
  { name: "SHEIN", url: "https://www.shein.com", logo: sheinLogo },
  { name: "RENUAR", url: "https://www.renuar.co.il", logo: renuarLogo },
];

export default function BrandsMarquee() {
  // מהירות בפיקסלים לשנייה (שני/י לפי הטעם)
  const SPEED = 70;

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const segmentRef = useRef(null);

  const [paused, setPaused] = useState(false);
  const items = useMemo(() => BRANDS, []);

  // מצבים פנימיים
  const xRef = useRef(0);
  const lastTsRef = useRef(0);
  const segWidthRef = useRef(0);

  // מנגנון גלילה רציף
  useEffect(() => {
    let rafId;

    const step = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000; // לשניות
      lastTsRef.current = ts;

      if (!paused && segWidthRef.current > 0) {
        xRef.current -= SPEED * dt;             // זזים שמאלה תמיד

        // עטיפה חלקה קדימה כל פעם שעברנו רוחב מקטע
        while (-xRef.current >= segWidthRef.current) {
          xRef.current += segWidthRef.current;
        }

        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${xRef.current}px,0,0)`;
        }
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [paused]);

  // שכפול דינמי: מכסים לפחות (רוחב-מסך + 2×מקטע) כדי שתמיד נכנס/יוצא אייקון בקצוות
  useEffect(() => {
    const ensureClones = () => {
      const segmentEl = segmentRef.current;
      const trackEl = trackRef.current;
      const viewportEl = viewportRef.current;
      if (!segmentEl || !trackEl || !viewportEl) return;

      // איפוס מצב
      xRef.current = 0;
      lastTsRef.current = 0;
      trackEl.style.transform = `translate3d(0,0,0)`;

      // הסרת שיבוטים קודמים
      Array.from(trackEl.querySelectorAll(".brands-segment"))
        .slice(1)
        .forEach((n) => n.remove());

      // מדידות עדכניות
      const segWidth = segmentEl.getBoundingClientRect().width;
      const viewportWidth = viewportEl.getBoundingClientRect().width;
      segWidthRef.current = segWidth;

      // שכפול עד שהאורך הכולל ≥ viewport + 2*seg (שוליים נסתרים בשני הצדדים)
      let total = segWidth;
      while (total < viewportWidth + segWidth * 2) {
        const clone = segmentEl.cloneNode(true);
        trackEl.appendChild(clone);
        total += segWidth;
      }

      // התחלה בהיסט אקראי בתוך מקטע (נראה פחות חוזר על עצמו)
      const rand = Math.random() * segWidth;
      xRef.current = -rand;
      trackEl.style.transform = `translate3d(${-rand}px,0,0)`;
    };

    ensureClones();

    // רספונסיבי
    const ro = new ResizeObserver(ensureClones);
    ro.observe(viewportRef.current);
    window.addEventListener("resize", ensureClones);
    window.addEventListener("orientationchange", ensureClones);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", ensureClones);
      window.removeEventListener("orientationchange", ensureClones);
    };
  }, []);

  return (
    <div
      className="brands-wrap"
      dir="rtl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="brands-viewport" ref={viewportRef}>
        <div className="brands-track" ref={trackRef}>
          {/* מקטע בסיס */}
          <div className="brands-segment" ref={segmentRef}>
            {items.map((b, i) => (
              <button
                key={`${b.url}-${i}`}
                className="brand-chip"
                onClick={() => window.open(b.url, "_blank", "noopener,noreferrer")}
                aria-label={`פתחו את ${b.name}`}
              >
                <img
                  src={b.logo}
                  alt={b.name}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = placeholderImg; }}
                />
              </button>
            ))}
          </div>
          {/* שיבוטים נוצרים דינמית ב-JS */}
        </div>
      </div>
    </div>
  );
}
