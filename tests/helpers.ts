export function jsonRequest(path: string, body: any) {
  const req = new Request('http://localhost' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return req as any
}
