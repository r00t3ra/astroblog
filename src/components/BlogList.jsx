import React, { useEffect, useState } from 'react';

function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(setPosts)
      .catch(() => setError('Failed to load posts'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;

  return (
    <ul>
      {posts.length === 0 && <li>No posts found.</li>}
      {posts.map(post => (
        <li key={post.id}>
          <a href={`/blog/${post.slug}/`}><b>{post.title}</b></a>
          <span style={{color:'gray',fontSize:'0.9em',marginLeft:'1em'}}>{post.published_at}</span>
        </li>
      ))}
    </ul>
  );
}

export default BlogList;
