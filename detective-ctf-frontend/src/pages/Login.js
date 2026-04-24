import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error,   setError]     = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate  = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(formData);
      const { userId, username, email, totalScore, isAdmin, token } = res.data;
      login({ userId, username, email, totalScore, isAdmin }, token);
      navigate('/cases');
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>GİRİŞ YAP</h1>
        <p className="auth-subtitle">// OPERATİF KİMLİK DOĞRULAMASI</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>KULLANICI ADI</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="Kullanıcı adınız" />
          </div>

          <div className="form-group">
            <label>ŞİFRE</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Şifreniz" />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'GİRİŞ YAPILIYOR...' : '→ GİRİŞ YAP'}
          </button>
        </form>

        <p className="auth-footer">
          Hesabın yok mu? <Link to="/register">Kayıt ol</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
