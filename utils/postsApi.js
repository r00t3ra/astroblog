// Utility functions for D1 blog API

export async function getPosts(db) {
  const { results } = await db.prepare('SELECT * FROM Posts ORDER BY published_at DESC').all();
  return results;
}

export async function getPostById(db, id) {
  const { results } = await db.prepare('SELECT * FROM Posts WHERE id = ?').bind(id).all();
  return results[0] || null;
}

export async function createPost(db, { title, slug, content }) {
  const { success, lastRowId } = await db.prepare('INSERT INTO Posts (title, slug, content) VALUES (?, ?, ?)').bind(title, slug, content).run();
  if (!success) throw new Error('Failed to create post');
  return getPostById(db, lastRowId);
}

export async function updatePost(db, id, { title, slug, content }) {
  await db.prepare('UPDATE Posts SET title = ?, slug = ?, content = ? WHERE id = ?').bind(title, slug, content, id).run();
  return getPostById(db, id);
}

export async function deletePost(db, id) {
  await db.prepare('DELETE FROM Posts WHERE id = ?').bind(id).run();
}
