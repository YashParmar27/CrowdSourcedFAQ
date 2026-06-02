import { useState } from 'react';
import api from '../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (!password) return setError('Please enter a new password.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', { token, password });
      setMessage(res.data.message || 'Password reset successful.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-center mb-4">Reset Password</h2>

          {message && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="New password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Confirm password" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
