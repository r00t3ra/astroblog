import { getPosts, getPostById, createPost, updatePost, deletePost } from '../../../utils/postsApi';

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Route: /api/posts or /api/posts/:id
  if (url.pathname === '/api/posts' && method === 'GET') {
    // List all posts
    return new Response(JSON.stringify(await getPosts(context.env.DB)), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (url.pathname === '/api/posts' && method === 'POST') {
    // Create new post
    const data = await request.json();
    const post = await createPost(context.env.DB, data);
    return new Response(JSON.stringify(post), { status: 201, headers: { 'Content-Type': 'application/json' } });
  }
  const postIdMatch = url.pathname.match(/^\/api\/posts\/(\d+)$/);
  if (postIdMatch) {
    const id = Number(postIdMatch[1]);
    if (method === 'GET') {
      const post = await getPostById(context.env.DB, id);
      if (!post) return new Response('Not found', { status: 404 });
      return new Response(JSON.stringify(post), { headers: { 'Content-Type': 'application/json' } });
    }
    if (method === 'PUT') {
      const data = await request.json();
      const post = await updatePost(context.env.DB, id, data);
      return new Response(JSON.stringify(post), { headers: { 'Content-Type': 'application/json' } });
    }
    if (method === 'DELETE') {
      await deletePost(context.env.DB, id);
      return new Response(null, { status: 204 });
    }
  }
  return new Response('Not found', { status: 404 });
}
