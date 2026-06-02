import { useState, useEffect } from 'react';
import api from '../services/api';

const AdminFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingFaq, setEditingFaq] = useState(null);
  const [viewingSource, setViewingSource] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    fetchFaqs();
  }, [filterStatus]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await api.get('/api/faqs', { params });
      setFaqs(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load FAQs. ' + (err.response?.data?.error || ''));
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/api/faqs/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `faqs_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('FAQs exported successfully');
    } catch (err) {
      setError('Failed to export FAQs.');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/api/faqs/${id}/status`, { status: newStatus });
      fetchFaqs();
      showSuccess(`FAQ status updated to ${newStatus}`);
    } catch (err) {
      setError('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/faqs/${id}`);
      fetchFaqs();
      showSuccess('FAQ deleted successfully');
    } catch (err) {
      setError('Failed to delete FAQ.');
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await api.put(`/api/faqs/${id}`, updates);
      setEditingFaq(null);
      fetchFaqs();
      showSuccess('FAQ updated successfully');
    } catch (err) {
      setError('Failed to update FAQ.');
    }
  };

  const handleBulkImport = async () => {
    try {
      const lines = importData.trim().split('\n');
      const imported = [];
      const errors = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 2) {
          errors.push(`Line ${i + 1}: Invalid format`);
          continue;
        }
        
        imported.push({
          question: parts[0],
          answer: parts[1],
          category: parts[2] || 'general',
          status: 'draft'
        });
      }

      if (imported.length === 0) {
        setError('No valid FAQs to import. Format: question | answer | category');
        return;
      }

      for (const faq of imported) {
        await api.post('/api/faqs', faq);
      }

      setImportModalOpen(false);
      setImportData('');
      fetchFaqs();
      showSuccess(`Successfully imported ${imported.length} FAQs!${errors.length > 0 ? ` ${errors.length} lines had errors.` : ''}`);
    } catch (err) {
      setError('Failed to import FAQs. ' + (err.response?.data?.error || ''));
    }
  };

  const statuses = ['draft', 'approved', 'published', 'rejected'];

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Manage FAQs</h1>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
          >
            Bulk Import
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

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
      ) : faqs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 mb-4">No FAQs found.</p>
          <p className="text-sm text-gray-400">Create FAQs from grouped questions or bulk import.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map(faq => (
            <div key={faq._id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
              {editingFaq?._id === faq._id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Question:</label>
                    <input
                      type="text"
                      value={editingFaq.question}
                      onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Answer:</label>
                    <textarea
                      value={editingFaq.answer}
                      onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category:</label>
                    <input
                      type="text"
                      value={editingFaq.category}
                      onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdate(faq._id, editingFaq)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >Save Changes</button>
                    <button
                      onClick={() => setEditingFaq(null)}
                      className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 text-sm"
                    >Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{faq.question}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {faq.category}
                        </span>
                        <span className={`px-2 py-1 rounded text-sm ${getStatusBadgeColor(faq.status)}`}>
                          {faq.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{faq.views || 0} views</span>
                      </div>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">
                        {faq.source_questions?.length > 0 ? (
                          <button 
                            onClick={() => setViewingSource(faq)}
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            {faq.source_questions.length} source question(s)
                          </button>
                        ) : (
                          <span className="text-gray-400">No source</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{faq.answer}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm border-t pt-3">
                    <select
                      value={faq.status}
                      onChange={(e) => handleStatusChange(faq._id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      {statuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setEditingFaq({ question: faq.question, answer: faq.answer, category: faq.category })}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >Edit</button>
                    <button
                      onClick={() => handleDelete(faq._id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >Delete</button>
                    <span className="text-gray-400 ml-auto">
                      Created: {new Date(faq.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {viewingSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Source Questions</h2>
              <button onClick={() => setViewingSource(null)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              FAQ: <span className="font-medium">{viewingSource.question}</span>
            </p>
            <div className="space-y-3">
              {viewingSource.source_questions?.map((q, index) => (
                <div key={q._id || index} className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm font-medium text-gray-800">{q.text}</p>
                </div>
              ))}
            </div>
            {(!viewingSource.source_questions || viewingSource.source_questions.length === 0) && (
              <p className="text-gray-500 text-center py-4">No source questions for this FAQ.</p>
            )}
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Bulk Import FAQs</h2>
              <button onClick={() => setImportModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Format: <code className="bg-gray-100 px-2 py-1 rounded">question | answer | category</code>
              <br />One FAQ per line. Category is optional (defaults to "general").
            </p>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={10}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="What is your return policy? | We offer 30-day returns | billing&#10;How do I contact support? | Email us at support@example.com | support"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleBulkImport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >Import FAQs</button>
              <button
                onClick={() => { setImportModalOpen(false); setImportData(''); }}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFAQs;