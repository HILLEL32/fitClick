import React, { useState } from 'react';
import manImg from '../photos/man.png';
import femaleImg from '../photos/female.png';
import { Link } from 'react-router-dom';


export default function Gender() {
  const [selectedGender, setSelectedGender] = useState('');

  return (
    <div className='container text-center'>
      <h2 className='my-4'>Choose your gender</h2>
      <div className="d-flex justify-content-center gap-5">
        <div
          onClick={() => setSelectedGender('male')}
          className={`p-3 border rounded ${selectedGender === 'male' ? 'border-primary border-3' : ''}`}
          style={{ cursor: 'pointer' }}
        >
          <img src={manImg} alt="Male" style={{ width: '150px' }} />
          <p className='mt-2'>Male</p>
        </div>

        <div
          onClick={() => setSelectedGender('female')}
          className={`p-3 border rounded ${selectedGender === 'female' ? 'border-primary border-3' : ''}`}
          style={{ cursor: 'pointer' }}
        >
          <img src={femaleImg} alt="Female" style={{ width: '150px' }} />
          <p className='mt-2'>Female</p>
        </div>
      </div>

      {selectedGender && (
        <div className='mt-4'>
          <strong>You selected: {selectedGender}</strong>
        </div>
      )}
      <Link to="/app_home" className="btn btn-success btn-lg floating-button">
        back to home
      </Link>

    </div>
  );
}
