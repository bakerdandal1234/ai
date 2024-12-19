import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState({ type: '', message: '' });
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    errors: {
      email: '',
      password: '',
      general: ''
    }
  });

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

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      setResetStatus({ type: 'error', message: 'Please enter your email address' });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetStatus({ 
          type: 'success', 
          message: 'Password reset instructions have been sent to your email' 
        });
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetEmail('');
          setResetStatus({ type: '', message: '' });
        }, 3000);
      } else {
        setResetStatus({ type: 'error', message: data.message });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setResetStatus({ 
        type: 'error', 
        message: 'Failed to connect to the server' 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormData(prev => ({
      ...prev,
      errors: {
        email: '',
        password: '',
        general: ''
      }
    }));

    try {
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        if (result.errorEmail) {
          setFormData(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              email: result.errorEmail
            }
          }));
        } else if (result.errorPassword) {
          setFormData(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              password: result.errorPassword
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              general: result.message || 'An error occurred during login.'
            }
          }));
        }
        return;
      }

      navigate('/home');

    } catch (error) {
      console.error("Login error:", error);
      setFormData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          general: "Failed to connect to the server. Please try again later."
        }
      }));
    }
  };

  return (
    <div className="login-container">
      {showForgotPassword && (
        <div className="modal-overlay" onClick={() => setShowForgotPassword(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button 
                className="close-button"
                onClick={() => setShowForgotPassword(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleForgotPassword} className="reset-form">
              <p className="modal-description">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              {resetStatus.message && (
                <div className={`status-message ${resetStatus.type}`}>
                  {resetStatus.type === 'success' && <span className="success-icon">✓</span>}
                  {resetStatus.type === 'error' && <span className="error-icon">✕</span>}
                  {resetStatus.message}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="resetEmail">Email Address</label>
                <input
                  type="email"
                  id="resetEmail"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="form-input"
                />
              </div>

              <button type="submit" className="submit-button">
                Send Reset Link
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="login-form-container">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Please sign in to continue</p>
        </div>

        {formData.errors.general && (
          <p className="error-message general-error">{formData.errors.general}</p>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={formData.errors.email ? 'has-error' : ''}
              required
            />
            {formData.errors.email && (
              <p className="error-message">{formData.errors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={formData.errors.password ? 'has-error' : ''}
              required
            />
            {formData.errors.password && (
              <p className="error-message">{formData.errors.password}</p>
            )}
          </div>

          <div className="form-footer">
            <button type="submit" className="submit-button">
              Login
            </button>
            <button 
                type="button" 
                className="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
          </div>
          {/* <div className="links"> */}
             
            {/* </div> */}
        </form>

        <div className="signup-link">
          Don't have an account? <a href="/signup">Create one</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
