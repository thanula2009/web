# D.S. Senanayake Central College, Mirigama: website and admin dashboard

Plain HTML, CSS and vanilla JavaScript. No build step. Works on GitHub Pages.
In production, staff authentication, dashboard content, and the audit trail are handled by Supabase.

## Local admin demo (not secure)

Without Supabase configured, the admin page runs as a browser-only demo:

- Username: `malith`
- Password: `malith123`
- Dashboard edits are saved only in the current browser's local storage.

This demo login is visible in the website's JavaScript and can be bypassed. It does not protect data and must not be used for a public or production website. Use the Supabase setup below before publishing the admin dashboard. Supabase mode uses real staff email/password accounts instead of these demo credentials.

## What is in the box

| Path | Purpose |
| --- | --- |
| `index.html`, `about.html`, `academics.html`, `activities.html`, `gallery.html`, `contact.html` | Public pages |
| `admin/login.html`, `admin/dashboard.html` | Staff portal |
| `css/style.css` | Design tokens, layout, all public components (admin reuses it) |
| `css/animations.css` | All motion, switched off for `prefers-reduced-motion` |
| `css/responsive.css` | Tablet and mobile rules |
| `css/admin.css` | Dashboard styles |
| `js/main.js` | Navigation, reveals, and loading of news, activities, gallery and page text |
| `js/statue.js` | Hero statue tilt, parallax and golden particles |
| `js/admin.js` | Login, password reset, dashboard modules |
| `js/config.js` | Supabase URL and public key (the only place to configure) |
| `supabase/schema.sql` | Tables, roles, security rules, audit log, image bucket |

## 1. Add the real images

The supplied official school emblem is included as a transparent-corner PNG:

Keep `images/school-emblem.png` in place; it is used across the site headers and admin pages. If the school provides an official transparent master, use that rather than a substitute.

The hero uses the included campus image. Add or replace `images/statue/statue.png` if a separate statue portrait is needed.

Other photos go in `images/school/`. Gallery items can use these site images or secure `https://` image URLs.

## 2. Set up Supabase (free plan is enough)

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it. If you already installed the schema, run it again to apply the editor-session limit and announcement priority updates.
3. **Authentication > Users > Add user**: create the first administrator with a strong password you choose.
4. In the SQL Editor run (use that person's email):
   `update public.profiles set role = 'main_admin', active = true where email = 'THEIR_EMAIL';`
5. **Authentication > Sign In / Providers**: turn **off** "Allow new users to sign up".
6. **Authentication > URL Configuration**: set the Site URL to your published site and add the full URL of `admin/login.html` to Redirect URLs (needed for password reset emails).
7. **Project Settings > API**: copy the Project URL and the `anon` public key into `js/config.js`.
   Never paste the `service_role` key anywhere in this project.

## 3. Publish on GitHub Pages

Upload the folder contents to a repository, then Settings > Pages > deploy from the main branch.
Because the admin pages are static files, anyone can open `admin/login.html`; only signed-in, activated staff can do anything, because the database enforces it.

## Security design

- Production Supabase passwords and secret keys are never stored in the code. The local demo password above is hard-coded and public by design; the anon key is safe only because Row Level Security is on for every table.
- Roles are enforced in the database, not the browser:
  - **Main admin**: everything, including deleting content, managing users, and reading the full audit log.
  - **Editor**: create, edit, publish and unpublish content; add secure gallery image URLs and reorder gallery items. Cannot delete news, announcements or activities, cannot manage users.
- New accounts start inactive. A main admin must activate them. Main admins cannot edit their own role, so they cannot lock themselves out.
- Sessions use Supabase Auth. Editor access ends after one hour (also enforced by database row-level security); main-admin access is checked against the active profile. Password resets use emailed links; new passwords need 12+ characters.
- Dashboard content changes are written to Supabase and cached in the browser. CRUD permissions are enforced by row-level security, and database triggers write the audit log.
- Gallery entries accept the included site images or `https://` image URLs. Supabase Storage has server-side size and MIME-type limits for a future upload interface.
- The audit log is filled by database triggers on every content, content-text and user change. It cannot be edited from the browser.
- Text from the database is always inserted with `textContent`, never as HTML. Public links and map embeds only accept `https`, `tel:`, `mailto:` and Google Maps embed addresses.

## Things to know

- The dashboard cannot create login accounts itself (that needs a secret key that must never sit in a static site). Invite people in Supabase, then activate them under **Admin users**.
- The pages load the Supabase library from a CDN. For stricter security, pin an exact version and add a Subresource Integrity hash to the `<script>` tag in both admin pages.
- All school facts (history, vision, mission, principal's message, contacts, programmes) are `[PLACEHOLDER: …]` until the school supplies verified text. Fill them in under **Page content** and **Contact details**.
