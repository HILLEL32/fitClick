import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/design.css';

/** Typewriter קטן שמסתובב על משפטים */
function Typewriter({ lines = [], typingSpeed = 45, pause = 1200 }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');

  useEffect(() => {
    let mounted = true;
    let i = 0;

    const type = () => {
      const line = lines[idx % lines.length];
      if (!mounted) return;
      if (i <= line.length) {
        setText(line.slice(0, i));
        i += 1;
        setTimeout(type, typingSpeed);
      } else {
        setTimeout(() => {
          // מחיקה מהירה כדי לכתוב את הבא
          const erase = () => {
            if (!mounted) return;
            if (i >= 0) {
              setText(line.slice(0, i));
              i -= 2;
              setTimeout(erase, 18);
            } else {
              setIdx((p) => (p + 1) % lines.length);
            }
          };
          erase();
        }, pause);
      }
    };
    type();
    return () => { mounted = false; };
  }, [idx, lines, typingSpeed, pause]);

  return (
    <span className="tw">
      {text}
      <span className="tw-caret" />
    </span>
  );
}

export default function Home() {
  return (
    <div className="home-wrap" dir="rtl">
      {/* שכבת טקסטורה דקה */}
      <div className="body-overlay" />

      {/* HERO מלא־רוחב */}
      <section className="hero">
        <div className="hero-inner">
          <h3 className="welcome">ברוכים הבאים ל־</h3>
          <h1 className="brand">fitClick</h1>

          <p className="subline">
            <Typewriter
              lines={[
                'היועץ האישי שלך לסטייל – לוק מדויק בכמה קליקים.',
                'אין רעיון? נזהה צבעים וסגנון ונבנה שילובים מנצחים.',
                'כל יום הוא הזדמנות להיראות ולהרגיש נהדר ✨',
              ]}
            />
          </p>

          <div className="cta-row">
            <Link to="/log_in" className="btn btn-cta">כניסה</Link>
            <Link to="/sign_up" className="btn btn-cta alt">הרשמה</Link>
            <Link to="/admin_signup" className="btn btn-cta alt">כניסת מנהלים</Link>
          </div>

          {/* באדג׳ים קטנים חיים */}
          <div className="badges">
            <div className="badge live"> שילוב של AI</div>
            <div className="badge glow">התאמה חכמה</div>
            <div className="badge soft">סגנון אישי</div>
          </div>
        </div>
      </section>

      {/* סרט נע עדין */}
      <div className="marquee">
        <div className="marquee-track">
          {/* <span>לוק יומי · שילובי צבעים · ייעוץ עונתי · ספורט/אלגנט · ארון חכם · </span>
          <span>לוק יומי · שילובי צבעים · ייעוץ עונתי · ספורט/אלגנט · ארון חכם · </span> */}
          <div class="inline-spaces">
            <span>לוק יומי </span>
            <span>שילובי צבעים</span>
            <span>ייעוץ עונתי</span>
            <span>ספורט/אלגנט</span>
            <span>ארון חכם</span>
          </div>
        </div>
      </div>

      {/* כרטיס הסבר “זכוכית” */}
      <section className="glass">
        <h3>מה זה fitClick?</h3>
        <p>
          מעלה פריטים מהארון, כותב/ת מה בא לך היום – והאפליקציה בונה לוקים חכמים לפי צבעים,
          סגנון אישי ועונה. רוצה ורוד-כהה עם טוויסט אלגנט? קל. מחפש/ת ספורטיבי נקי? מצוין.
        </p>
        <ul className="bullets">
          <li>זיהוי צבעים וסגנונות מתוך התמונות שלך</li>
          <li>התאמות אוטומטיות עם הסבר ולמה זה עובד</li>
          <li>עוגן סביב פריט מסוים מהארון</li>
        </ul>
      </section>

      {/* גריד פיצ׳רים */}
      <section className="features">
        <article className="card feature">
          <div className="icon float">🎨</div>
          <h4>צבעים חכמים</h4>
          <p>התאמות על בסיס פלטות וריאציות (בהיר/כהה/ניטרלי).</p>
        </article>
        <article className="card feature">
          <div className="icon wobble">🧠</div>
          <h4>AI סטייליסט</h4>
          <p>שואל/ת בלייב – מקבל/ת לוק, נימוק ואלטרנטיבות.</p>
        </article>
        <article className="card feature">
          <div className="icon bob">🧥</div>
          <h4>Anchor Item</h4>
          <p>בוחרים פריט מפתח – אנחנו מסדרים את כל הלוק סביבו.</p>
        </article>
      </section>

      {/* קישורי CTA כפולים גם בסוף כדי שלא נגלול חזרה */}
      {/* <div className="cta-row tail">
        <Link to="/log_in" className="btn btn-cta">log in</Link>
        <Link to="/sign_up" className="btn btn-cta alt">sign up</Link>
      </div> */}

      {/* דקורציות רקע צפות */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
    </div>
  );
}
