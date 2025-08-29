import { Link } from 'react-router-dom';
import '../css/design.css';

export default function Home() {
  return (
    <div className="container mt-5">
      {/* Hero Section */}
      <section className="text-center mb-5">
        <h3 className="welcome">ברוכים הבאים ל</h3>
        <h1 className="line">fitClick</h1>
        <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
          <Link to="/log_in" className="btn custom-green-button">log in</Link>
          <Link to="/sign_up" className="btn custom-green-button">sign up</Link>
        </div>
      </section>

      {/* Features Section */}

      <section className="intro-text">
        <div className="typewriter"> <h3>fitClick – היועץ האישי שלך לסטייל</h3> </div> <br />
        <div className="typewriter"> <h4>נמאס לך להתלבט מול הארון?</h4> </div>
        <div className="typewriter"> <h4>האפליקציה שלנו מזהה את הבגדים שהעלית ומציעה שילובים חכמים לפי צבעים וסגנון</h4></div>
        <div className="typewriter"> <h4>כל מה שצריך לעשות זה להעלות פריטים מארון הבגדים ולכתוב מה באלך ללבוש היום!</h4></div>
        <div className="typewriter">  <h4>המערכת תתאים לך לוק מהחלומות לפי העדפות סגנון אישי ובקשת לוק</h4></div>
        <div className="typewriter"> <h4>אז למה את/ה מחכה? הצטרף/י אלינו עכשיו ותתחיל/י ליהנות מהסטייל החדש שלך!</h4></div>
        <div className="typewriter"> <h4>fitClick - כי כל יום הוא הזדמנות להיראות ולהרגיש נהדר!</h4></div>
      </section>




    </div>
  );
}