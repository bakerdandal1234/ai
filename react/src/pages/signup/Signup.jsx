import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    errors: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
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
        [name]: '' 
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setFormData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          confirmPassword: 'Passwords do not match!'
        }
      }));
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        if (result.errors && Array.isArray(result.errors)) {
          const newErrors = { ...formData.errors };
          
          result.errors.forEach(item => {
            switch(item.path) {
              case 'email':
                newErrors.email = "Please provide a valid email";
                break;
              case 'username':
                newErrors.username = "Username is required";
                break;
              case 'password':
                newErrors.password = "Password must be at least 6 characters";
                break;
              default:
                break;
            }
          });

          setFormData(prev => ({
            ...prev,
            errors: newErrors
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              general: result.message || "Error during signup"
            }
          }));
        }
        return;
      }

      console.log("Signup successful:", result);
      navigate('/login');

    } catch (error) {
      console.error("Signup error:", error);
      setFormData(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          general: "Failed to sign up. Please try again."
        }
      }));
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form-container">
        <div className="signup-header">
          <h2>Create Account</h2>
          <p>Fill in your information to get started</p>
        </div>
        
        {formData.errors.general && (
          <p className="error-message general-error">{formData.errors.general}</p>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className={formData.errors.username ? 'has-error' : ''}
              required
            />
            {formData.errors.username && (
              <p className="error-message">{formData.errors.username}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
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
              placeholder="Create your password"
              className={formData.errors.password ? 'has-error' : ''}
              required
            />
            {formData.errors.password && (
              <p className="error-message">{formData.errors.password}</p>
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
              placeholder="Confirm your password"
              className={formData.errors.confirmPassword ? 'has-error' : ''}
              required
            />
            {formData.errors.confirmPassword && (
              <p className="error-message">{formData.errors.confirmPassword}</p>
            )}
          </div>

          <button type="submit" className="submit-btn">
            Create Account
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="/login">Login here</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
