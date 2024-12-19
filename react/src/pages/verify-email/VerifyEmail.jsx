import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [formData, setFormData] = useState({
    status: 'verifying',
    isVerified: false,
    alreadyVerified: false,
    errors: {
      general: ''
    }
  });
  
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      if (!token) {
        setFormData(prev => ({
          ...prev,
          status: 'error',
          errors: {
            general: 'Verification token is missing'
          }
        }));
        return;
      }

      const response = await fetch(`http://localhost:3000/verify-email?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        if (data.alreadyVerified) {
          setFormData(prev => ({
            ...prev,
            status: 'success',
            isVerified: true,
            alreadyVerified: true,
            errors: {
              general: 'Your email is already verified. You can proceed to login.'
            }
          }));
        } else if (data.isVerified) {
          setFormData(prev => ({
            ...prev,
            status: 'success',
            isVerified: true,
            errors: {
              general: data.message || 'Email verified successfully!'
            }
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          status: 'error',
          isVerified: data.isVerified || false,
          errors: {
            general: data.isVerified 
              ? 'Your email is already verified. You can proceed to login.'
              : data.message || 'Verification failed'
          }
        }));
      }
    } catch (error) {
      console.error('Verification error:', error);
      setFormData(prev => ({
        ...prev,
        status: 'error',
        errors: {
          general: 'Failed to verify email. Please try again.'
        }
      }));
    }
  };

  const handleRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <div className={`verify-email-icon ${formData.status}`}>
          {formData.status === 'verifying' && '⌛'}
          {formData.isVerified && '✓'}
          {!formData.isVerified && formData.status === 'error' && '✕'}
        </div>
        
        <h2 className="verify-email-title">
          {formData.status === 'verifying' && 'Verifying Your Email'}
          {formData.isVerified && (formData.alreadyVerified ? 'Email Already Verified!' : 'Email Verified!')}
          {!formData.isVerified && formData.status === 'error' && 'Verification Failed'}
        </h2>
        
        <p className="verify-email-message">{formData.errors.general}</p>
        
        {(formData.isVerified || formData.status === 'error') && (
          <button 
            className="verify-email-button"
            onClick={handleRedirect}
          >
            {formData.isVerified ? 'Continue to Login' : 'Try Again'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
