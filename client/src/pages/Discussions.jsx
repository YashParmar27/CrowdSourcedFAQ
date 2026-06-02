import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Discussions = () => {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDiscussions = async () => {
    try {
      const res = await api.get('/api/discussions');
      setList(res.data.discussions || []);
    } catch (e) {
      console.error('Failed to load discussions', e);
    }
  };

  useEffect(() => { fetchDiscussions(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !text) return;
    setLoading(true);
    try {
      await api.post('/api/discussions', { title, text });
      setTitle(''); setText('');
      fetchDiscussions();
    } catch (err) {
      console.error('Create failed', err);
      alert(err.response?.data?.error || 'Create failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Discussions</h1>

      {user ? (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 bg-white p-4 rounded shadow-sm">
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Title" className="w-full p-2 border rounded" />
          <textarea value={text} onChange={(e)=>setText(e.target.value)} placeholder="Start a discussion..." className="w-full p-2 border rounded" rows={4} />
          <div className="flex justify-end">
            <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">{loading? 'Posting...' : 'Post Discussion'}</button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 rounded">Please login to create discussions.</div>
      )}

      <div className="space-y-3">
        {list.length === 0 && <div className="p-4 bg-white rounded shadow-sm">No discussions yet.</div>}
        {list.map(d => (
          <div key={d._id} className="bg-white p-4 rounded shadow-sm">
            <Link to={`/discussions/${d._id}`} className="text-lg font-medium text-blue-600">{d.title}</Link>
            <div className="text-sm text-gray-600">by {d.author?.username || 'Unknown'} • {d.replies_count || 0} replies</div>
            <p className="mt-2 text-gray-800">{d.text && d.text.substring(0, 240)}{d.text && d.text.length > 240 ? '...' : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Discussions;
