import React, { useMemo, useRef, useState } from "react";
import '../../css/Stores.css';

// לוגואים מתוך src/photos
import zaraLogo from "../../photos/zara.png";
import mangoLogo from "../../photos/mango.jpeg";
import castroLogo from "../../photos/castro.svg";
import tamnoonLogo from "../../photos/tamnoon.png";
import sheinLogo from "../../photos/shein.jpeg";
import renuarLogo from "../../photos/renuar.png";
import placeholderImg from "../../photos/man.png"; // פלייסהולדר קיים

const BRANDS = [
  { name: "", url: "https://www.zara.com", logo: zaraLogo },
  { name: "", url: "https://shop.mango.com", logo: mangoLogo },
  { name: "", url: "https://www.castro.com", logo: castroLogo },
  { name: "", url: "https://www.tamnoon.co.il", logo: tamnoonLogo },
  { name: "", url: "https://www.shein.com", logo: sheinLogo },
  { name: "", url: "https://www.renuar.co.il", logo: renuarLogo },
];

export default function BrandsMarquee({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const trackRef = useRef(null);

  // שכפול הרשימה לגלילה אינסופית
  const looped = useMemo(() => [...BRANDS, ...BRANDS, ...BRANDS], []);

  const handleEnter = (brand) => {
    setSelected(brand);
    onSelect?.(brand);
  };

  return (
    <div className="brands-wrap" dir="rtl">
      <div
        className="brands-track"
        ref={trackRef}
        onMouseEnter={() => trackRef.current?.classList.add("paused")}
        onMouseLeave={() => trackRef.current?.classList.remove("paused")}
        onFocus={() => trackRef.current?.classList.add("paused")}
        onBlur={() => trackRef.current?.classList.remove("paused")}
      >
        {looped.map((b, i) => (
          <button
            key={`${b.url}-${i}`}
            className={`brand-chip ${selected?.url === b.url ? "active" : ""}`}
            onMouseEnter={() => handleEnter(b)}
            onFocus={() => handleEnter(b)}
            onClick={() => window.open(b.url, "_blank", "noopener,noreferrer")}
            aria-label={`פתחו את ${b.url}`}
          >
            <img
              src={b.logo}
              alt={b.name || "brand"}
              loading="lazy"
              onError={(e) => { e.currentTarget.src = placeholderImg; }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
