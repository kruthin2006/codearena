import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = form;
      const response = await axios.post('http://localhost:5000/api/auth/register', registerData);
      if (response.data.success) {
        login(response.data.token, response.data.user);
        toast.success('Account created! 🎉');
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '420px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6c63ff, #ff6b6b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Create Account
          </h1>
          <p style={{ color: '#666', marginTop: '5px' }}>Join CodeArena today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              background: '#f8f9fa',
              fontSize: '16px',
              marginBottom: '12px',
            }}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              background: '#f8f9fa',
              fontSize: '16px',
              marginBottom: '12px',
            }}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              background: '#f8f9fa',
              fontSize: '16px',
              marginBottom: '12px',
            }}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              background: '#f8f9fa',
              fontSize: '16px',
              marginBottom: '12px',
            }}
            required
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #ddd',
              background: '#f8f9fa',
              fontSize: '16px',
              marginBottom: '20px',
            }}
          >
            <option value="student">Student</option>
            <option value="setter">Problem Setter</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #6c63ff, #5a52d5)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '15px',
            }}
          >
            {loading ? '⏳ Creating...' : '🚀 Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#666' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#6c63ff', fontWeight: 600, textDecoration: 'none' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;