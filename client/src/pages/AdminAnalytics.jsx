import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4'];

const KPI_CARD_COLORS = {
  totalFAQs: { bg: 'bg-blue-50', text: 'text-blue-600', icon: '📝' },
  totalPublished: { bg: 'bg-green-50', text: 'text-green-600', icon: '✅' },
  totalAI: { bg: 'bg-purple-50', text: 'text-purple-600', icon: '🤖' },
  totalQuestions: { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: '❓' },
  activeUsers7d: { bg: 'bg-orange-50', text: 'text-orange-600', icon: '👥' },
  conversionRate: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: '📊' }
};

const KPI_LABELS = {
  totalFAQs: 'Total FAQs',
  totalPublished: 'Published',
  totalAI: 'AI-Generated FAQs',
  totalQuestions: 'Total Questions',
  activeUsers7d: 'Active Users (7d)',
  conversionRate: 'Conversion Rate'
};

const KPI_FORMATTERS = {
  totalFAQs: (v) => v,
  totalPublished: (v) => v,
  totalAI: (v) => v,
  totalQuestions: (v) => v,
  activeUsers7d: (v) => v,
  conversionRate: (v) => `${v}%`
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow-lg border rounded-lg p-3 text-sm">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/activities/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  const kpiData = [
    { key: 'totalFAQs', value: stats.totalFAQs },
    { key: 'totalPublished', value: stats.totalPublished },
    { key: 'totalAI', value: stats.totalAI },
    { key: 'totalQuestions', value: stats.totalQuestions },
    { key: 'activeUsers7d', value: stats.activeUsers7d },
    { key: 'conversionRate', value: stats.conversionRate }
  ];

  const statusPieData = (stats.faqStatusDistribution || []).map(s => ({
    name: s._id || 'unknown',
    value: s.count
  }));

  const categoryData = (stats.topCategories || []).map(c => ({
    name: c._id || 'uncategorized',
    count: c.count
  }));

  const activityData = (stats.dailyActivity || []).map(a => ({
    date: a._id,
    activities: a.count
  }));

  const typeData = (stats.activityTypeCounts || []).map(t => ({
    name: t._id.replace(/_/g, ' '),
    count: t.count
  }));

  const userRegData = (stats.userRegistrations || []).map(r => ({
    date: r._id,
    registrations: r.count
  }));

  const loginData = (stats.userLogins || []).map(l => ({
    date: l._id,
    logins: l.count
  }));

  const questionSubData = (stats.questionSubmissions || []).map(q => ({
    date: q._id,
    questions: q.count
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of FAQ Generator activity</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpiData.map(({ key, value }) => {
          const colors = KPI_CARD_COLORS[key] || { bg: 'bg-gray-50', text: 'text-gray-600', icon: '📊' };
          return (
            <div key={key} className={`${colors.bg} rounded-lg shadow-sm p-4 border`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{colors.icon}</span>
              </div>
              <p className="text-2xl font-bold mb-1">{KPI_FORMATTERS[key](value)}</p>
              <p className={`text-xs ${colors.text} font-medium`}>{KPI_LABELS[key]}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="font-semibold text-lg mb-4">Daily Activity (30 Days)</h2>
          {activityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="activities" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Activities" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">No data available</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="font-semibold text-lg mb-4">FAQ Status Distribution</h2>
          {statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusPieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">No FAQs created yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="font-semibold text-lg mb-4">User Registrations (30 Days)</h2>
          {userRegData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userRegData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="registrations" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Registrations" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No registrations yet</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="font-semibold text-lg mb-4">User Logins (30 Days)</h2>
          {loginData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={loginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="logins" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Logins" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No login data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="font-semibold text-lg mb-4">Question Submissions (30 Days)</h2>
          {questionSubData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={questionSubData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="questions" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Questions" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No question submissions yet</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="font-semibold text-lg mb-4">Activities by Type</h2>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No activity data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="font-semibold text-lg mb-4">Top Categories</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="FAQs" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No categories yet</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="font-semibold text-lg mb-4">FAQ Status Distribution</h2>
          {statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusPieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">No FAQs created yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
