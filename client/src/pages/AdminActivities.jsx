import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const ACTIVITY_TYPES = [
  { value: '', label: 'All Types', icon: '📋' },
  { value: 'faq_created', label: 'FAQ Created', icon: '📝' },
  { value: 'faq_approved', label: 'FAQ Approved', icon: '✅' },
  { value: 'faq_published', label: 'FAQ Published', icon: '🎉' },
  { value: 'faq_rejected', label: 'FAQ Rejected', icon: '❌' },
  { value: 'faq_deleted', label: 'FAQ Deleted', icon: '🗑️' },
  { value: 'question_submitted', label: 'Question Submitted', icon: '❓' },
  { value: 'question_grouped', label: 'Questions Grouped', icon: '📦' },
  { value: 'ai_suggestion', label: 'AI Suggestion', icon: '🤖' },
  { value: 'user_registered', label: 'User Registered', icon: '👤' },
  { value: 'user_login', label: 'User Login', icon: '🔐' }
];

const DATE_RANGES = [
  { value: '', label: 'All Time' },
  { value: '1', label: 'Today' },
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '90', label: 'Last 90 Days' }
];

const ACTIVITY_ICON_MAP = Object.fromEntries(
  ACTIVITY_TYPES.filter(t => t.value).map(t => [t.value, t.icon])
);

const formatIST = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

const getRelativeTime = (dateStr) => {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatIST(dateStr).split(',')[0];
};

const AdminActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState({ daily: [], byType: [] });

  const LIMIT = 30;

  const fetchActivities = useCallback(async (append = false) => {
    try {
      setLoading(true);
      const params = { limit: LIMIT };
      if (filterType) params.type = filterType;
      if (filterDate) {
        params.dateFrom = new Date(Date.now() - parseInt(filterDate) * 24 * 60 * 60 * 1000).toISOString();
      }
      if (search) params.search = search;
      if (append) params.offset = offset;

      const [activitiesRes, statsRes] = await Promise.all([
        api.get('/api/activities', { params }),
        api.get('/api/activities/stats').catch(() => ({ data: null }))
      ]);
      
      const data = activitiesRes.data;

      if (append) {
        setActivities(prev => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
        setOffset(0);
      }
      setTotal(data.total);
      
      if (statsRes.data) {
        const dailyData = (statsRes.data.dailyActivity || []).map(a => ({
          date: a._id,
          activities: a.count
        }));
        const typeData = (statsRes.data.activityTypeCounts || []).map(t => ({
          name: t._id.replace(/_/g, ' '),
          count: t.count
        }));
        setChartData({ daily: dailyData, byType: typeData });
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load activities. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, filterDate, search, offset]);

  useEffect(() => {
    setOffset(0);
    fetchActivities(false);
  }, [filterType, filterDate, search]);

  useEffect(() => {
    if (offset > 0) fetchActivities(true);
  }, [offset]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true);
      setOffset(0);
      fetchActivities(false).then(() => setRefreshing(false));
    }, 3600000);
    return () => clearInterval(interval);
  }, [filterType, filterDate, search]);

  const handleRefresh = () => {
    setRefreshing(true);
    setOffset(0);
    fetchActivities(false);
  };

  const handleLoadMore = () => {
    setOffset(prev => prev + LIMIT);
  };

  const handleExportCSV = () => {
    const headers = ['Type', 'Description', 'User', 'Email', 'AI Generated', 'Timestamp (IST)'];
    const rows = activities.map(a => [
      a.type,
      `"${(a.description || '').replace(/"/g, '""')}"`,
      a.user_name || '',
      a.user_email || '',
      a.is_ai_generated ? 'Yes' : 'No',
      formatIST(a.created_at)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Activity Feed</h1>
          <p className="text-sm text-gray-500 mt-1">
            Auto-refreshes every hour. Last refresh: {formatIST(new Date())}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors flex items-center gap-1"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Activity Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {ACTIVITY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {DATE_RANGES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {chartData.daily.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Activity Trend (30 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="activities" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-medium text-gray-900 mb-4">Activity by Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {loading && activities.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg mb-2">No activities found</p>
          <p className="text-sm text-gray-400">Try changing filters or check back later.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {activities.map((activity) => (
              <div
                key={activity._id}
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">
                      {ACTIVITY_ICON_MAP[activity.type] || '📋'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-medium text-gray-900 break-words">{activity.description}</span>
                        {activity.is_ai_generated && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium flex-shrink-0">
                            🤖 AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                        {activity.user_name && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {activity.user_name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{activity.type?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-sm text-gray-500" title={formatIST(activity.created_at)}>
                      {getRelativeTime(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activities.length < total && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
              >
                {loading ? 'Loading...' : `Load More (${activities.length} of ${total})`}
              </button>
            </div>
          )}

          <div className="text-center text-sm text-gray-400 mt-4">
            Showing {activities.length} of {total} activities
          </div>
        </>
      )}
    </div>
  );
};

export default AdminActivities;
