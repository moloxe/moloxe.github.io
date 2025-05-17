import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  const res = await fetch('http://localhost:8887', {
    method: 'GET',
  })
  const SCRIPT = await res.text()
  return new Response(SCRIPT, {
    headers: { 'Content-Type': 'application/javascript' },
  })
}
