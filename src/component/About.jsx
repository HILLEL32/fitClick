import { Link } from "react-router-dom";
import "../css/About.css";

export default function AboutPage() {
    return (
        <main dir="rtl" className="home-wrap about-variant">
            {/* HERO */}
            <section className="hero hero--about">
                <div className="hero-inner hero-inner--about">
                    <h1 className="brand">FitClick — יועץ סטייל דיגיטלי</h1>
                    <p className="subline">
                        עמוד אודות קצר, תמציתי ומדויק: מי אנחנו, מה אנחנו מציעים, ומה התועלת הברורה למשתמש.
                    </p>

                    <div className="badges">
                        <span className="badge live">עברית · RTL</span>
                        <span className="badge glow">פרטיות ואבטחה</span>
                        <span className="badge soft">נגיש</span>
                    </div>
                </div>
            </section>

            {/* סרט נע של ערכים */}
            <section className="glass" aria-labelledby="who-title">
                <h3 id="who-title">מי אנחנו</h3>
                <p>
                    FitClick נולד כדי להפוך את ההתלבטות היומית מול הארון לבחירה פשוטה.
                    האפליקציה מאפשרת העלאה של פריטי לבוש, ולאחר מכן מציעה שילובים חכמים
                    בהתאם לסגנון, לצבעים ולהעדפות המשתמש.
                </p>
                <p>
                    הפיתוח החל כחלק מפרויקט גמר במסלול{" "}
                    <b>הנדסאי תוכנה וסייבר במכללת אריאל</b>,
                    במטרה לחבר בין עולמות הטכנולוגיה והאופנה וליצור כלי דיגיטלי נגיש,
                    שימושי ומעורר השראה.
                </p>
                <p>
                    המטרה היא ליצור כלי רשמי, נקי ומדויק שמציע ערך אמיתי —
                    חסכון בזמן, השראה יומיומית ורעיונות חדשים ללוקים מהארון האישי שלך.
                </p>
            </section>


            {/* “מה אנחנו מציעים” – שלושה פיצ׳רים */}
            <section className="features" aria-labelledby="offer-title">

                <article className="card feature">
                    <div className="icon float" aria-hidden>🧺</div>
                    <h4>ארון דיגיטלי מסודר</h4>
                    <p>העלאת פריטים, תיוג לפי סוג/צבע/סגנון, וניהול נוח מכל מכשיר.</p>
                </article>

                <article className="card feature">
                    <div className="icon wobble" aria-hidden>🪄</div>
                    <h4>שילובים חכמים</h4>
                    <p>התאמות מבוססות העדפות ועונה — מפיקים יותר ממה שכבר יש.</p>
                </article>

                <article className="card feature">
                    <div className="icon bob" aria-hidden>🎯</div>
                    <h4>חוויית שימוש מוקפדת</h4>
                    <p>ממשק בעברית מלאה, עיצוב מדויק ונגישות גבוהה.</p>
                </article>
            </section>
            <br />

            {/* “איך זה עובד” – כרטיס זכוכית עם רשימת צעדים */}
            <section className="glass" aria-labelledby="how-title">
                <h3 id="how-title">איך זה עובד</h3>
                <ul className="bullets">
                    <li><strong>מעלים את הארון</strong> — מצלמים ומוסיפים פריטים לפי סוג וצבע.</li>
                    <li><strong>מקבלים הצעות</strong> — שילובים מותאמים אישית לפי סגנון והעדפות.</li>
                </ul>
            </section>

            {/* צור קשר – כרטיס זכוכית עם פרטים אישיים */}
            <section className="glass" aria-labelledby="contact-title">
                <h3 id="contact-title">צור קשר</h3>
                <p>אשמח לשמוע מכם! לשאלות, הערות או הצעות לשיפור:</p>

                <ul className="contact-list">
                    <li><b>שם:</b> הלל דניאל</li>
                    <li>
                        <b>מייל:</b>{" "}
                        <a href="mailto:your-email@example.com">your-email@example.com</a>
                    </li>
                    <li>
                        <b>טלפון:</b>{" "}
                        <a href="tel:0500000000">050-0000000</a>
                    </li>
                    <li><b>מוסד לימודים:</b> מכללת אריאל – הנדסאי תוכנה וסייבר</li>
                </ul>

                <div className="cta-row tail">
                    <a className="btn btn-cta" href="mailto:your-email@example.com">שליחת מייל</a>
                </div>
            </section>

            {/* בלובים דקורטיביים לפי התבנית */}
            <div className="blob b1" aria-hidden />
            <div className="blob b2" aria-hidden />
            <div className="blob b3" aria-hidden />

            {/* FOOTER תחתון — המידע שביקשת להעביר לשורה התחתונה */}
            <footer aria-label="פרטי מערכת">
                <div className="inline-spaces">
                    <span>שפה: עברית · RTL</span>
                    <span>פרטיות: ניהול פרופיל מאובטח בענן</span>
                </div>
            </footer>
        </main>
    );
}
