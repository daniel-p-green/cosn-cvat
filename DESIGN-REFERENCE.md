# Design provenance

The current visual direction was informed by a user-supplied screenshot of the MSBA homepage, reviewed October 21, 2026. The screenshot is not included in the project or public repository. This is screenshot-based visual matching, not an official MSBA style guide or an extraction of computed website CSS.

Observed motifs were a deep violet header, white civic/education pictograms, a white canvas, pale blue section rules and muted violet/plum accents. Pixel sampling found dominant header/icon-strip color `#1e105f`, nearby tile colors `#4c407e` / `#4c4080`, and a plum accent near `#720944`. JPEG compression affects sampled values. The blue rule `#91b9e6` is a visual match rather than a verified official token.

The interface uses original cap, people, shield, book and calendar pictograms with a consistent stroke treatment. No MSBA logo, proprietary font, screenshot, marketing imagery or downloaded icon set is included. Arial/Helvetica is a system fallback; the screenshot cannot establish the site's actual font.

Semantic tokens in `dist/tokens.css` and native recipes in `dist/kit.js` provide consistent controls. This is a buildless HTML/CSS/JavaScript component kit, not the React shadcn package. Text, control, hover and focus tones were adjusted for readability rather than copied mechanically from the reference.

The teacher workflow starts with a classroom idea and produces an editable request for IT. Vendor responses and district analyst work remain separate. Mobile navigation uses a compact Menu drawer; optional help and source notes are available without blocking the first task.

Earlier interface revisions used a separate project's white/charcoal typography reference. The current palette reflects the screenshot described above. No official OpenAI or MSBA brand compliance, affiliation or endorsement is claimed. CoSN/EDUCAUSE attribution and CC BY-NC-SA 4.0 remain independent of this visual reference.

Automated viewport and enlarged-text checks support layout regression testing; they do not replace actual device, screen-reader or user testing. See README.md for verified coverage and limitations.
