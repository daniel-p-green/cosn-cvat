# Standalone hosting and handoff

CoSN CVAT does **not** require ChatGPT, a ChatGPT account, Sites, an OpenAI API key, Cloudflare, a database or a server application. Sites is an optional public demonstration host. The same static files can run on MSBA's or a district's own website.

## What to give the host

Use a release checkout of this public repository. Publish the **contents of `dist/`** together, including the bundled workbook, data, modules, styles and vendor license notices. Keep the repository's README, LICENSE, source attribution and third-party notices with any source redistribution. Do not copy `.git/`, local drafts, test downloads, credentials or a different owner's hosting configuration.

There is no production dependency installation or build. Python is needed only for the local preview command; Node.js and Playwright are needed only for development checks. No build service or paid API is required.

## Deployment options

| Existing environment | Setup |
| --- | --- |
| IIS, Apache, Nginx or an existing school/MSBA web server | Copy `dist/` contents to a static web directory; enable HTTPS and serve `index.html` as its index. |
| GitHub Pages | Publish the `dist/` directory from this repository through the organization's normal Pages workflow; do not run a framework build or add secrets. |
| Another static host | Select `dist/` as the publish directory and leave the build command empty. |
| Local/offline-network preview | Run `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`, then open `http://127.0.0.1:4173`. |

The app uses hash navigation (`#start`, `#analyst`, etc.), so no application-route rewrite is required. Assets are relative; a subdirectory such as `/tools/cvat/` works when opened with its trailing slash. Serve JavaScript as a JavaScript MIME type and allow ordinary static GETs for JSON and XLSX files. Deploy a complete release together rather than mixing module/data versions. Double-clicking `index.html` is unsupported because browsers restrict its data fetches.

HTTPS is required for supported browser microphone/clipboard features outside localhost. Browser and institutional speech policies can still disable dictation; typing remains available. No real microphone is required for setup verification.

## Records and privacy after a move

The host receives ordinary static-page requests; the app does not upload assessment answers or create server-side records. Optional drafts use this browser's local storage. Server access restrictions/log retention are the host's responsibility and are distinct from app behavior.

Moving from the demonstration Site to another origin does not move local drafts. Before moving, use **Save a backup**, transfer that JSON through an approved channel, then **Open a backup** at the new host. Exported JSON/XLSX contains the entered assessment information. Never publish backups or assessment exports as website assets. Do not enter student personal data or credentials.

Browser dictation may send audio to the browser provider. Local audio processing is not guaranteed, and this app stores no audio. There is no hidden ChatGPT/CoSN API dependency for the forms, calculations or file exchange; source/reference links open only when chosen.

## Acceptance check on the new host

1. Open teacher intake, optional help and the phone Menu. Confirm the intended release in **Source & attribution** and **Changelog**.
2. Create a fictional teacher request. Confirm no vendor security answers are inferred.
3. Import a synthetic backup, inspect the analyst calculations/crosswalk, export JSON and editable XLSX, then reimport and compare. Check the bundled original workbook download.
4. Reload with local saving off/on and confirm the documented behavior. Test keyboard and relevant device layouts; review the organization's speech/storage policies separately.

The public release's independent verification and its limits are in [VERIFICATION.md](VERIFICATION.md). Actual Safari/iPad hardware, screen readers and real microphone capture are not implied by desktop tests.

## License

This is public source under **CC BY-NC-SA 4.0**, with CoSN/EDUCAUSE attribution and retained noncommercial/share-alike conditions—not unrestricted MIT/OSI-style open source. Bundled software has separate retained notices. See [LICENSE.md](LICENSE.md) before redistribution or adaptation. Commercial use outside those terms requires permission from the relevant rights holders. Self-hosting does not imply endorsement by CoSN, EDUCAUSE or MSBA.
