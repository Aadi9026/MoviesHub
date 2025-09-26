import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/auth';

const AdminLogin = () => {
  const [email, setEmail] = useState('scam6390@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    const result = await loginAdmin(email, password);
    
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleDemoFill = () => {
    setPassword('6390Prince');
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-form">
          <div className="login-header">
            <i className="fas fa-user-shield"></i>
            <h2>MoviesHub Admin</h2>
            <p>Sign in to manage your content</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scam6390@gmail.com"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </>
              )}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary demo-btn"
              onClick={handleDemoFill}
              disabled={loading}
            >
              <i className="fas fa-magic"></i>
              Auto-fill Demo Credentials
            </button>
          </form>

          <div className="login-footer">
            <div className="credentials-info">
              <h4>Admin Credentials:</h4>
              <p><strong>Email:</strong> scam6390@gmail.com</p>
              <p><strong>Password:</strong> 6390Prince</p>
            </div>
            
            <div className="security-notice">
              <i className="fas fa-shield-alt"></i>
              <small>This panel is restricted to authorized administrators only.</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
