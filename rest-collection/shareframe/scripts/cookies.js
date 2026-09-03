// Parses Set-Cookie response headers into a {name: value} map.
// Bruno's jar handles sending cookies back; this only exposes the readable
// csrftoken (and sf_access for jwt-verify) to the collection's variables.
function readCookies(res) {
  const headers = typeof res.getHeaders === 'function' ? res.getHeaders() : res.headers;
  const raw = headers && (headers['set-cookie'] || headers['Set-Cookie']);
  if (!raw) return {};

  const list = Array.isArray(raw) ? raw : [raw];
  return list.reduce((acc, entry) => {
    const [pair] = String(entry).split(';');
    const idx = pair.indexOf('=');
    if (idx > 0) acc[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    return acc;
  }, {});
}

module.exports = { readCookies };
