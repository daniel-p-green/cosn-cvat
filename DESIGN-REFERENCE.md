# Design reference and typography refinement

The verified project reference is `sites-agentsbootcampdemo/app/globals.css` inside Daniel’s local `builder-bootcamp-sf-2026` project, inspected October 21, 2026.

Its relevant declarations are white `#fff`, charcoal `#202020`, primary actions in charcoal, neutral secondary `#f4f4f4`, muted text `#626262`, border `#dedede`, input border `#858585`, a 10px base radius and Arial/Helvetica sans-serif. The file’s SHA-256 is `9e78c9cf71deac42b4bd84971503acfbd1a358a0b74bab7aefe37242fdca6568`.

Supporting project evidence: `codex-learning-lab-cc/docs/PRD-v5.0.md`, section 6, explicitly identifies the existing Bootcamp app styles as the confirmed visual reference and says not to assume a separate missing style guide. The original `builder-bootcamp-sf/labs/lab05_codex_readiness_guided/styles/globals.css` declares white/#171717, OpenAI Sans with Arial/Helvetica fallback, visible focus and reduced motion. The later Bootcamp Sites implementation uses Arial/Helvetica directly.

This is a project reference, not a claim of an official OpenAI style guide. We use the verified Sites font stack. No proprietary font files are copied, embedded or fetched. No OpenAI logo, affiliation or endorsement is implied. CoSN/EDUCAUSE attribution and CC BY-NC-SA 4.0 remain intact.

## Decisions applied to CoSN CVAT

- Teacher goal: turn a classroom idea into a useful request for IT, with expected information distinct from confirmed vendor answers.
- Domain: classroom activity, tool review, expected information, supporting evidence, uncertainty and the district review process. The signature remains the editable request beside its originating classroom notes.
- Palette: white, charcoal, neutral gray surfaces, muted gray text and quiet gray boundaries. No decorative color or new score semantics.
- Typography: Arial/Helvetica at 16px body, 1.6 line-height; headings 500 weight with modest tracking and balanced natural wrapping. Headline 36px desktop, 28px phone. Helper/privacy text at least 14px in the teacher flow.
- Rhythm: 4px spacing scale; 20/28px form padding at phone/desktop, 24/32px group gaps, 32/48px column gaps. Borders establish structure; only dialogs have a restrained shadow.
- Components: consistent 10px fields and disclosures, 12px form panels, restrained rounded actions; transparent step navigation with thin progress lines. Native controls and semantics remain.
- Removed forced heading line breaks, repetitive oversized hero sentences, blue/sage speech treatments and the unused earlier teacher stylesheet. The teacher flow now has one layout stylesheet; voice.css only owns shared writing/speech controls.
- Phone primary actions use their own full-width row so labels do not wrap needlessly. No fixed-height text blocks or clipped summaries.

## Verification

`npm run check` and `npm run test:browser` cover source parity, drafts, requests, backup import/export, onboarding focus/keyboard, clipboard fallback, printing and mocked browser speech. Five viewports: 1440×1000, 768×1024, 1024×768, 390×844 and 320×740. Doubled text and reduced-height interaction paths remain functional.

Screenshots were rendered and visually inspected for the intake, information choices, editable handoff and first-run orientation. Native iPad keyboard and actual speech capture remain untested; desktop simulation and mocked speech do not prove device behavior.
