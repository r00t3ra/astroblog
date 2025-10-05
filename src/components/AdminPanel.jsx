import React, { useState, useEffect } from 'react';

const REPO_OWNER = 'r00t3ra';
const REPO_NAME = 'astroblog';
const BLOG_PATH = 'src/content/blog';

function base64encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64decode(str) {
  return decodeURIComponent(escape(atob(str)));
}

function getFileNameFromTitle(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '.md'
  );
}

function fetchGitHubAPI(token, url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    },
  });
}

function MarkdownPreview({ content }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    if (!content) return setHtml('');
    // Use GitHub's markdown API for preview
    fetch('https://api.github.com/markdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content, mode: 'gfm' }),
    })
      .then(res => res.text())
      .then(setHtml);
  }, [content]);
  return <div style={{border:'1px solid #ddd',padding:'1em',marginTop:'1em',background:'#fafbfc'}} dangerouslySetInnerHTML={{ __html: html }} />;
}

function AdminPanel() {
  const [token, setToken] = useState('');
  const [auth, setAuth] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // {filename, title, content, tags, sha}
  const [form, setForm] = useState({ title: '', content: '', tags: '' });
  const [preview, setPreview] = useState('');

  // Authenticate by checking token
  const handleTokenSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetchGitHubAPI(token, 'https://api.github.com/user');
      if (res.ok) {
        setAuth(true);
        fetchPosts(token);
      } else {
        setError('Invalid token');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  // Fetch list of blog posts
  const fetchPosts = async (token) => {
    setLoading(true);
    setError('');
    try {
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BLOG_PATH}`;
      const res = await fetchGitHubAPI(token, url);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const files = await res.json();
      setPosts(files.filter(f => f.name.endsWith('.md') || f.name.endsWith('.mdx')));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Load post for editing
  const handleEdit = async (file) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchGitHubAPI(token, file.url);
      if (!res.ok) throw new Error('Failed to fetch file');
      const data = await res.json();
      const content = base64decode(data.content.replace(/\n/g, ''));
      // Parse frontmatter
      const match = content.match(/^---([\s\S]*?)---\n([\s\S]*)$/);
      let title = '', tags = '', body = content;
      if (match) {
        const fm = match[1];
        body = match[2];
        title = (fm.match(/title:\s*['"]?(.+?)['"]?$/m) || [,''])[1];
        tags = (fm.match(/tags:\s*\[(.*?)\]/m) || [,''])[1];
      }
      setEditing({ filename: file.name, sha: data.sha });
      setForm({ title, content: body, tags });
      setPreview(body);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Delete post
  const handleDelete = async (file) => {
    if (!window.confirm(`Delete ${file.name}?`)) return;
    setLoading(true);
    setError('');
    try {
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BLOG_PATH}/${file.name}`;
      const res = await fetchGitHubAPI(token, url, {
        method: 'DELETE',
        body: JSON.stringify({
          message: `Delete post ${file.name}`,
          sha: file.sha,
        }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchPosts(token);
      setEditing(null);
      setForm({ title: '', content: '', tags: '' });
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
      const { title, content, tags } = form;
      if (!title || !content) throw new Error('Title and content required');
      const filename = editing?.filename || getFileNameFromTitle(title);
      const frontmatter = `---\ntitle: '${title}'\n` + (tags ? `tags: [${tags}]\n` : '') + `---\n`;
      const md = frontmatter + content;
      const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BLOG_PATH}/${filename}`;
      const body = {
        message: editing ? `Update post ${filename}` : `Add post ${filename}`,
        content: base64encode(md),
        ...(editing ? { sha: editing.sha } : {}),
      };
      const res = await fetchGitHubAPI(token, url, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      fetchPosts(token);
      setEditing(null);
      setForm({ title: '', content: '', tags: '' });
      setPreview('');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Start new post
  const handleNew = () => {
    setEditing(null);
    setForm({ title: '', content: '', tags: '' });
    setPreview('');
  };

  // Update form
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'content') setPreview(value);
  };

  return (
    <div style={{maxWidth:600,margin:'2em auto',fontFamily:'sans-serif'}}>
      <h2>Astroblog Admin Panel</h2>
      {!auth ? (
        <form onSubmit={handleTokenSubmit} style={{marginBottom:'2em'}}>
          <label>GitHub Token: <input type="password" value={token} onChange={e=>setToken(e.target.value)} style={{width:'60%'}} /></label>
          <button type="submit" disabled={loading} style={{marginLeft:'1em'}}>Login</button>
          {error && <div style={{color:'red'}}>{error}</div>}
        </form>
      ) : (
        <>
          <button onClick={handleNew} style={{marginBottom:'1em'}}>New Post</button>
          <div style={{marginBottom:'2em'}}>
            <h3>Posts</h3>
            {loading ? <div>Loading...</div> : (
              <ul style={{listStyle:'none',padding:0}}>
                {posts.map(file => (
                  <li key={file.sha} style={{marginBottom:'0.5em'}}>
                    <b>{file.name}</b>
                    <button onClick={()=>handleEdit(file)} style={{marginLeft:'1em'}}>Edit</button>
                    <button onClick={()=>handleDelete(file)} style={{marginLeft:'0.5em',color:'red'}}>Delete</button>
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
              <label>Tags (comma separated):<br/>
                <input name="tags" value={form.tags} onChange={handleChange} style={{width:'100%'}} />
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
        </>
      )}
    </div>
  );
}

export default AdminPanel;
