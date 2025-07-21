import { Link } from 'react-router-dom';
import '../css/design.css';

export default function Home() {
  return (
    <div className='container mt-5 text-center'>
      <h5>welcome to</h5>
      <h1 className='line'>fitClick</h1>

      <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
        <Link to="/log_in" className="btn btn-success btn-lg">log in</Link>
        <Link to="/sign_up" className="btn btn-success btn-lg">sign up</Link>
        <Link to="/gender" className="btn btn-success btn-lg">gender</Link>
        <Link to="/bodyColor" className="btn btn-success btn-lg">body color</Link>
        <Link to="/user_profile" className="btn btn-success btn-lg">user profile</Link>
        <Link to="/add_clothing" className="btn btn-success btn-lg">add clothing</Link>
        <Link to="/clothing_ai" className="btn btn-success btn-lg">AI garment inspection</Link>
      </div>
    </div>
  );
}
