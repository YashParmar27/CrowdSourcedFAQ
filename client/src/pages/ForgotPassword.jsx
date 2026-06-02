import { useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message || 'If an account exists, an email was sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send email');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-center mb-4">Forgot Password</h2>
          <p className="text-sm text-gray-600 text-center mb-4">Enter the email for your account and we'll send a password reset link.</p>

          {message && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">Remembered? <Link to="/login" className="text-blue-600">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
