import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    email: '',
    errors: {
      password: '',
      confirmPassword: '',
      general: ''
    }
  });
  const [status, setStatus] = useState('verifying'); // verifying, valid, invalid, success
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`http://localhost:3000/reset-password/${token}`);
      const data = await response.json();

      if (response.ok) {
        setStatus('valid');
        setFormData(prev => ({
          ...prev,
          email: data.email
        }));
      } else {
        setStatus('invalid');
        setFormData(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            general: data.message || 'Invalid or expired reset token'
          }
        }));
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setStatus('invalid');
      setFormData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          general: 'Failed to verify reset token'
        }
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      errors: {
        ...prev.errors,
        [name]: '',
        general: ''
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {
      password: '',
      confirmPassword: '',
      general: ''
    };

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setFormData(prev => ({
      ...prev,
      errors: newErrors
    }));

    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setFormData(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            general: 'Password has been successfully reset'
          }
        }));
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setFormData(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            general: data.message || 'Failed to reset password'
          }
        }));
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setFormData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          general: 'Failed to connect to the server'
        }
      }));
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <div className="status-message">
            <div className="spinner"></div>
            <p>Verifying reset token...</p>
          </div>
        );

      case 'invalid':
        return (
          <div className="status-message error">
            <div className="error-icon">✕</div>
            <p>{formData.errors.general}</p>
            <button onClick={() => navigate('/login')} className="return-button">
              Return to Login
            </button>
          </div>
        );

      case 'success':
        return (
          <div className="status-message success">
            <div className="success-icon">✓</div>
            <p>{formData.errors.general}</p>
            <p className="redirect-message">Redirecting to login page...</p>
          </div>
        );

      case 'valid':
        return (
          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-header">
              <h2>Reset Your Password</h2>
              <p>Enter a new password for {formData.email}</p>
            </div>

            {formData.errors.general && (
              <div className="error-message">{formData.errors.general}</div>
            )}

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className={`form-input ${formData.errors.password ? 'error' : ''}`}
              />
              {formData.errors.password && (
                <div className="error-message">{formData.errors.password}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className={`form-input ${formData.errors.confirmPassword ? 'error' : ''}`}
              />
              {formData.errors.confirmPassword && (
                <div className="error-message">{formData.errors.confirmPassword}</div>
              )}
            </div>

            <button type="submit" className="submit-button">
              Reset Password
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        {renderContent()}
      </div>
    </div>
  );
};

export default ResetPassword;
