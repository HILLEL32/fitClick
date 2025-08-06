import { Link } from 'react-router-dom';
import '../css/design.css';

export default function Home() {
  return (
    <div className='container mt-5 text-center'>
      <h3>wellcome to </h3>
      <h1 className='line'>fitClick</h1>

      <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
        <Link to="/log_in" className="btn btn-success btn-lg custom-green-button">log in</Link>
        <Link to="/sign_up" className="btn btn-success btn-lg custom-green-button">sign up</Link>
        {/*  */}
      </div>
    </div>
  );
}
