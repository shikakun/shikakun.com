export const prerender = false;

import { MESSAGE_FORM_API_TOKEN, MESSAGE_FORM_API_URL } from 'astro:env/server';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  let body: { message?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { message, name } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(MESSAGE_FORM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'バナナブレッドのラジオのおたより',
        message,
        name: name || undefined,
        token: MESSAGE_FORM_API_TOKEN,
      }),
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: 'Failed to send message' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to send message' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
