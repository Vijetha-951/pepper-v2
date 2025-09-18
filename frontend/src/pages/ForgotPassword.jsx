import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import authService from '../services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (value) => /\S+@\S+\.\S+/.test((value || '').trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) return setError('Email is required');
    if (!validateEmail(email)) return setError('Please enter a valid email');

    setIsSubmitting(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      if (res.success) {
        setSuccess(res.message || 'Password reset email sent.');
      } else {
        setError(res.error || 'Failed to send reset email.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 12, padding: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
          <ArrowLeft size={18} /> Back to login
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 10px 25px rgba(16,185,129,0.35)' }}>
            <Mail size={24} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: 24, color: '#111827' }}>Forgot Password</h2>
          <p style={{ marginTop: 6, color: '#6b7280' }}>Enter your email to receive a reset link.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 14, color: '#374151', marginBottom: 6 }}>Email Address</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '2px solid #e5e7eb', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
            <Mail size={18} color="#9ca3af" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))}
              placeholder="you@example.com"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: '#111827' }}
            />
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 14, marginTop: 2 }}>{error}</p>}
          {success && (
            <p style={{ color: '#10b981', fontSize: 14, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={16} /> {success}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} style={{ width: '100%', marginTop: 14, padding: '12px 16px', borderRadius: 12, border: 'none', color: 'white', fontWeight: 600, fontSize: 16, cursor: 'pointer', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 8px 20px rgba(16,185,129,0.35)', opacity: isSubmitting ? 0.85 : 1 }}>
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          If you don’t see the email, check Spam/Promotions folders.
        </p>
      </div>
    </div>
  );
}