/**
 * The answer a BROWSER gets when it lands somewhere that does not exist.
 *
 * A service that answers JSON still gets visited by people: an origin is easy to copy, trim
 * or guess, and an application can list it among someone's links. What they would see
 * otherwise is `{"success":false,"message":"Cannot GET /"}`, which reads as a broken product
 * rather than an address that was never a page.
 *
 * Only for a request that asked for HTML. `Accept: text/html` is what a navigation sends and
 * what neither `curl` nor `fetch` sends by default — both ask with a wildcard — so no API
 * client falls into this branch and starts parsing markup.
 */
export function browserErrorPage(input: {
  statusCode: number;
  message: string;
  /** The service's name, shown under the message («Arcana», «Taller»). */
  service: string;
  /** What this service is, said to a person who reached an address with no page. */
  notFoundLead?: string;
  /** Where a person can actually go; omitted when nothing is configured. */
  homeUrl?: string;
}): string {
  const title = input.statusCode === 404 ? 'Esta dirección no existe' : 'Algo salió mal';
  const lead =
    input.statusCode === 404
      ? (input.notFoundLead ?? 'La dirección no corresponde a ninguna página de este servicio.')
      : 'El servicio no pudo responder a esta dirección.';

  const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const link = input.homeUrl ? `<a class="go" href="${escape(input.homeUrl)}">Ir a Torfax</a>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)} · Torfax</title><style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#f6f8fa; font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
         color:#1f2328; padding:24px; }
  .card { background:#fff; border:1px solid #d0d7de; border-radius:12px; padding:32px;
          width:100%; max-width:420px; box-shadow:0 1px 3px rgba(0,0,0,.06); }
  h1 { margin:0 0 6px; font-size:20px; letter-spacing:-.3px; }
  p { margin:0 0 20px; font-size:14px; color:#57606a; line-height:1.55; }
  code { font-size:12px; color:#57606a; background:#f6f8fa; border:1px solid #d0d7de;
         border-radius:6px; padding:2px 6px; }
  .go { display:inline-block; padding:10px 16px; font-size:14px; font-weight:600; color:#fff;
        background:#0969da; border-radius:7px; text-decoration:none; }
  .go:hover { background:#0860ca; }
  @media (prefers-color-scheme: dark) {
    body { background:#0d1117; color:#e6edf3; }
    .card { background:#161b22; border-color:#30363d; }
    p, code { color:#8d96a0; }
    code { background:#0d1117; border-color:#30363d; }
  }
</style></head>
<body><main class="card">
  <h1>${escape(title)}</h1>
  <p>${escape(lead)}</p>
  ${link}
  <p style="margin:20px 0 0"><code>${input.statusCode} · ${escape(input.service)}</code></p>
</main></body>
</html>`;
}
