import React, { useState, useEffect } from 'react';


function getSlugFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function MarkdownPreview({ content }) {
  // Basit bir markdown-to-html dönüştürücü (sadece preview için)
  // Gerçek markdown için bir kütüphane eklenebilir
  return (
    <div style={{border:'1px solid #ddd',padding:'1em',marginTop:'1em',background:'#fafbfc'}}>
      <pre style={{whiteSpace:'pre-wrap'}}>{content}</pre>
    </div>
  );
}


function AdminPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // {id, title, content, slug}
  const [form, setForm] = useState({ title: '', content: '' });
  const [preview, setPreview] = useState('');

  // Fetch list of blog posts
  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };


  // Load post for editing
  const handleEdit = (post) => {
    setEditing(post);
    setForm({ title: post.title, content: post.content });
    setPreview(post.content);
  };


  // Delete post
  const handleDelete = async (post) => {
    if (!window.confirm(`Delete ${post.title}?`)) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchPosts();
      setEditing(null);
      setForm({ title: '', content: '' });
      setPreview('');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };


  // Save (create or update) post
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { title, content } = form;
      if (!title || !content) throw new Error('Title and content required');
      const slug = getSlugFromTitle(title);
      let res;
      if (editing) {
        res = await fetch(`/api/posts/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, slug, content }),
        });
      } else {
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, slug, content }),
        });
      }
      if (!res.ok) throw new Error('Failed to save');
      fetchPosts();
      setEditing(null);
      setForm({ title: '', content: '' });
      setPreview('');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };


  // Start new post
  const handleNew = () => {
    setEditing(null);
    setForm({ title: '', content: '' });
    setPreview('');
  };


  // Update form
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'content') setPreview(value);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div style={{maxWidth:600,margin:'2em auto',fontFamily:'sans-serif'}}>
      <h2>Astroblog Admin Panel</h2>
      <button onClick={handleNew} style={{marginBottom:'1em'}}>New Post</button>
      <div style={{marginBottom:'2em'}}>
        <h3>Posts</h3>
        {loading ? <div>Loading...</div> : (
          <ul style={{listStyle:'none',padding:0}}>
            {posts.map(post => (
              <li key={post.id} style={{marginBottom:'0.5em'}}>
                <b>{post.title}</b>
                <button onClick={()=>handleEdit(post)} style={{marginLeft:'1em'}}>Edit</button>
                <button onClick={()=>handleDelete(post)} style={{marginLeft:'0.5em',color:'red'}}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleSave} style={{border:'1px solid #ccc',padding:'1em',borderRadius:6}}>
        <div style={{marginBottom:'1em'}}>
          <label>Title:<br/>
            <input name="title" value={form.title} onChange={handleChange} style={{width:'100%'}} />
          </label>
        </div>
        <div style={{marginBottom:'1em'}}>
          <label>Content (Markdown):<br/>
            <textarea name="content" value={form.content} onChange={handleChange} rows={10} style={{width:'100%',fontFamily:'monospace'}} />
          </label>
        </div>
        <button type="submit" disabled={loading}>{editing ? 'Update' : 'Add'} Post</button>
        {error && <div style={{color:'red',marginTop:'1em'}}>{error}</div>}
      </form>
      <div style={{marginTop:'2em'}}>
        <h4>Live Preview</h4>
        <MarkdownPreview content={preview} />
      </div>
    </div>
  );
}

export default AdminPanel;
