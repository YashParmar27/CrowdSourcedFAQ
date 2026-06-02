import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordRequirements = [
    { regex: /.{8,}/, text: 'At least 8 characters', met: password.length >= 8 },
    { regex: /[A-Z]/, text: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { regex: /[a-z]/, text: 'One lowercase letter', met: /[a-z]/.test(password) },
    { regex: /[0-9]/, text: 'One number', met: /[0-9]/.test(password) },
    { regex: /[!@#$%^&*(),.?":{}|<>]/, text: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      
      setCheckingUsername(true);
      try {
        const response = await api.get(`/api/users/check-username/${username}`);
        setUsernameAvailable(response.data.available);
      } catch (err) {
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkUsername, 300);
    return () => clearTimeout(debounce);
  }, [username]);

  const validate = () => {
    const newErrors = {};
    
    if (!username) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is already taken';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!allRequirementsMet) {
      newErrors.password = 'Password does not meet requirements';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setErrors({});

    try {
      await register(username, email, password);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      if (errorMsg.includes('already exists')) {
        if (errorMsg.toLowerCase().includes('username')) {
          setErrors({ username: 'Username is already taken' });
        } else if (errorMsg.toLowerCase().includes('email')) {
          setErrors({ email: 'Email is already registered' });
        } else {
          setErrors({ general: errorMsg });
        }
      } else {
        setErrors({ general: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  const getUsernameStatus = () => {
    if (checkingUsername) return { text: 'Checking...', color: 'text-gray-400' };
    if (username.length === 0) return null;
    if (username.length < 3) return { text: 'Username must be at least 3 characters', color: 'text-gray-400' };
    if (usernameAvailable === true) return { text: 'Username is available', color: 'text-green-500' };
    if (usernameAvailable === false) return { text: 'Username is already taken', color: 'text-red-500' };
    return null;
  };

  const usernameStatus = getUsernameStatus();

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-center mb-8">Create Your Account</h1>
      
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) setErrors({ ...errors, username: '' });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.username ? 'border-red-500' : usernameAvailable === false ? 'border-red-300' : ''
            }`}
            placeholder="Choose a username"
          />
          {usernameStatus && (
            <p className={`text-xs mt-1 ${usernameStatus.color}`}>
              {usernameStatus.text}
            </p>
          )}
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : ''
            }`}
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.password ? 'border-red-500' : ''
            }`}
            placeholder="Create a strong password"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req, index) => (
                <p key={index} className={`text-xs flex items-center gap-1 ${
                  req.met ? 'text-green-500' : 'text-gray-400'
                }`}>
                  <span>{req.met ? '✓' : '○'}</span>
                  {req.text}
                </p>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword ? 'border-red-500' : confirmPassword && password === confirmPassword ? 'border-green-300' : ''
            }`}
            placeholder="Confirm your password"
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
          {confirmPassword && password === confirmPassword && (
            <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>
          )}
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || usernameAvailable === false}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      
      <p className="text-center text-sm text-gray-600 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:text-blue-800">Login here</Link>
      </p>
    </div>
  );
};

export default Register;