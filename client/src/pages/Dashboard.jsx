import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [myFaqs, setMyFaqs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ myQuestions: 0, myFaqs: 0 });
  const [activeTab, setActiveTab] = useState('questions');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchMyData();
    }
  }, [user]);

  const fetchMyData = async () => {
    try {
      const [questionsRes, faqsRes, notifRes] = await Promise.all([
        api.get('/api/questions/my'),
        api.get('/api/faqs/my'),
        api.get('/api/notifications').catch(() => ({ data: { notifications: [], unreadCount: 0 } }))
      ]);

      let myQuestions = questionsRes.data;
      if (myQuestions.length === 0) {
        const allRes = await api.get('/api/questions');
        myQuestions = allRes.data;
      }

      setQuestions(myQuestions);
      setMyFaqs(faqsRes.data);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(notifRes.data.unreadCount || 0);
      setStats({
        myQuestions: myQuestions.length,
        myFaqs: faqsRes.data.length
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      grouped: 'bg-purple-100 text-purple-800',
      reviewed: 'bg-yellow-100 text-yellow-800',
      converted_to_faq: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      approved: 'bg-blue-100 text-blue-800',
      published: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">My Dashboard</h1>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map(notif => (
                    <div
                      key={notif._id}
                      onClick={() => !notif.is_read && markNotificationRead(notif._id)}
                      className={`p-4 border-b last:border-0 cursor-pointer hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${!notif.is_read ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                          <p className="text-gray-600 text-xs mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-gray-400 text-xs mt-1">{new Date(notif.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <h3 className="text-gray-500 text-xs mb-1">My Questions</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.myQuestions}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <h3 className="text-gray-500 text-xs mb-1">My FAQs</h3>
          <p className="text-2xl font-bold text-green-600">{stats.myFaqs}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <h3 className="text-gray-500 text-xs mb-1">Questions → FAQs</h3>
          <p className="text-2xl font-bold text-purple-600">
            {stats.myQuestions > 0 ? Math.round((stats.myFaqs / stats.myQuestions) * 100) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <h3 className="text-gray-500 text-xs mb-1">Account</h3>
          <p className="text-lg font-semibold text-gray-700">{user.role}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b flex">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'faqs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My FAQs ({myFaqs.length})
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'questions' && (
            <>
              {questions.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 mb-2">You haven't submitted any questions yet.</p>
                  <p className="text-sm text-gray-400 mb-4">Submit a question and our team will review it.</p>
                  <Link
                    to="/submit-question"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Submit Your First Question
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map(q => (
                    <div key={q._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">{q.text}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{q.category}</span>
                            {getStatusBadge(q.status)}
                            {q.status === 'new' && (
                              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs">⏳ Awaiting review</span>
                            )}
                            {q.status === 'grouped' && (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">📦 Grouped with similar questions</span>
                            )}
                            {q.status === 'reviewed' && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">👀 Under consideration</span>
                            )}
                            {q.status === 'converted_to_faq' && (
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">✅ Converted to FAQ</span>
                            )}
                            {q.status === 'rejected' && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs">❌ Not approved</span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-400 whitespace-nowrap">{formatDate(q.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Question submitted on {formatDate(q.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'faqs' && (
            <>
              {myFaqs.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 mb-2">No FAQs created from your questions yet.</p>
                  <p className="text-sm text-gray-400 mb-4">When an admin converts your questions to FAQs and publishes them, they will appear here.</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left text-sm">
                    <p className="font-medium text-blue-800 mb-2">FAQ Status Guide:</p>
                    <div className="space-y-1 text-blue-700">
                      <p><span className="font-medium">Draft:</span> FAQ created but under review</p>
                      <p><span className="font-medium">Approved:</span> FAQ approved by admin</p>
                      <p><span className="font-medium">Published:</span> Visible to everyone on the homepage</p>
                      <p><span className="font-medium">Rejected:</span> FAQ was not approved</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {myFaqs.map(faq => (
                    <div key={faq._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{faq.question}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{faq.category}</span>
                            {faq.is_ai_generated && (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">🤖 AI Generated</span>
                            )}
                            {getStatusBadge(faq.status)}
                            {faq.status !== 'published' && (
                              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded text-xs">
                                {faq.status === 'draft' ? '⏳ Awaiting review' : 
                                 faq.status === 'approved' ? '⏳ Awaiting publish' : 
                                 '❌ Rejected by admin'}
                              </span>
                            )}
                            {faq.status === 'published' && (
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">✅ Live on homepage</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{faq.answer}</p>
                      {faq.source_questions && faq.source_questions.length > 0 && (
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Source questions ({faq.source_questions.length}):</span>
                          <ul className="mt-1 ml-4 space-y-1">
                            {faq.source_questions.slice(0, 3).map((sq, i) => (
                              <li key={sq._id || i} className="text-gray-600">• {sq.text}</li>
                            ))}
                            {faq.source_questions.length > 3 && (
                              <li className="text-gray-400">+ {faq.source_questions.length - 3} more...</li>
                            )}
                          </ul>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        Created {formatDate(faq.created_at)}
                        {faq.views > 0 && <span> • {faq.views} views</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;