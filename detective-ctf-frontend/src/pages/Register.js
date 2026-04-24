import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error,   setError]     = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate  = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Şifreler eşleşmiyor'); return; }
    if (formData.password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      const res = await authAPI.register(registerData);
      const { userId, username, email, totalScore, isAdmin, token } = res.data;
      login({ userId, username, email, totalScore, isAdmin }, token);
      navigate('/cases');
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>KAYIT OL</h1>
        <p className="auth-subtitle">// YENİ OPERATİF KAYDEDİLİYOR</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>KULLANICI ADI</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required placeholder="Operatif adınızı seçin" />
          </div>
          <div className="form-group">
            <label>E-POSTA</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="E-posta adresiniz" />
          </div>
          <div className="form-group">
            <label>ŞİFRE</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Şifrenizi oluşturun" />
          </div>
          <div className="form-group">
            <label>ŞİFRE TEKRAR</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Şifrenizi tekrar girin" />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'KAYDEDİLİYOR...' : '✓ KAYIT OL'}
          </button>
        </form>

        <p className="auth-footer">
          Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
