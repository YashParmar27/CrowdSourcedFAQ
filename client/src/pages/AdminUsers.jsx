import { useState, useEffect } from 'react';
import api from '../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/users/stats')
      ]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const viewUserDetails = async (user) => {
    try {
      const response = await api.get(`/api/users/${user._id}`);
      setUserDetails(response.data);
      setSelectedUser(user);
    } catch (err) {
      setError('Failed to load user details.');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.put(`/api/users/${id}`, { role: newRole });
      fetchData();
      showSuccess(`User role updated to ${newRole}`);
    } catch (err) {
      setError('Failed to update user role.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/users/${id}`);
      fetchData();
      showSuccess('User deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Never' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportUsersCSV = () => {
    const headers = ['Username', 'Email', 'Role', 'Member Since', 'Last Login', 'Login Count'];
    const rows = users.map(u => [
      u.username,
      u.email,
      u.role,
      formatDate(u.created_at),
      formatDate(u.last_login),
      u.login_count || 0
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Users exported successfully');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
        <button
          onClick={exportUsersCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
        >
          Export CSV
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <h3 className="text-gray-500 text-xs mb-1">Total Users</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <h3 className="text-gray-500 text-xs mb-1">Admins</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.adminCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <h3 className="text-gray-500 text-xs mb-1">Total Logins</h3>
            <p className="text-2xl font-bold text-green-600">{stats.totalLogins}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <h3 className="text-gray-500 text-xs mb-1">Today</h3>
            <p className="text-2xl font-bold text-cyan-600">{stats.questionsToday}</p>
            <p className="text-xs text-gray-400">questions</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <h3 className="text-gray-500 text-xs mb-1">This Week</h3>
            <p className="text-2xl font-bold text-indigo-600">{stats.questionsThisWeek}</p>
            <p className="text-xs text-gray-400">questions</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border">
            <h3 className="text-gray-500 text-xs mb-1">Published FAQs</h3>
            <p className="text-2xl font-bold text-emerald-600">{stats.totalPublishedFaqs}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold hover:opacity-70">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="font-bold hover:opacity-70">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="loading-spinner"></div></div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Member Since</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Last Login</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Logins</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{u.username}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(u.last_login)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {u.login_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewUserDetails(u)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          className="text-xs border rounded px-1 py-0.5"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button
                          onClick={() => handleDelete(u._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">User Details</h2>
              <button onClick={() => { setSelectedUser(null); setUserDetails(null); }} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            
            {userDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Username</label>
                    <p className="font-medium">{userDetails.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="font-medium">{userDetails.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Role</label>
                    <p className={`font-medium ${userDetails.role === 'ADMIN' ? 'text-purple-600' : ''}`}>
                      {userDetails.role}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Login Count</label>
                    <p className="font-medium">{userDetails.login_count || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Member Since</label>
                    <p className="font-medium">{formatDate(userDetails.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Login</label>
                    <p className="font-medium">{formatDate(userDetails.last_login)}</p>
                  </div>
                </div>
                
                {userDetails.stats && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-2">Activity</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-500">Questions Submitted</p>
                        <p className="text-xl font-bold">{userDetails.stats.questions_submitted}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-500">FAQs Generated</p>
                        <p className="text-xl font-bold">{userDetails.stats.faqs_created_from_questions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;