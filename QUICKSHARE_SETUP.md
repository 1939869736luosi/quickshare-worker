## QuickShare Mode Notes

This fork adapts pastebin-worker to QuickShare-style HTML/Markdown/SVG/Mermaid
rendering on Cloudflare Workers + D1.

### Key Behavior

- Content types: `html`, `markdown`, `svg`, `mermaid`, or `auto` (server detect).
- Short links: `/view/:id` renders the result directly.
- Password protection: toggle at create time; password is server-generated (5 digits).
- Raw view: `/raw/:id` returns the original content (password required if protected).

### Important Endpoints

- `POST /api/create` body: `content`, `content_type`, `is_protected`, `expire`
- `GET /api/get?id=...&password=...` (password optional)
- `GET /view/:id?password=...` (rendered preview)
- `GET /raw/:id?password=...` (raw source)

### Safety

Preview pages set a CSP sandbox. The detail page renders previews in a sandboxed
iframe to allow HTML/JS without exposing cookies or storage.
