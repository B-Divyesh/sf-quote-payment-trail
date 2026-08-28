# Deal Thread — visual thesis

## Direction: glacial minimal ceramics

Deal Thread should feel like sorting paper records across a cool stone worktable: calm, exact, tactile, and durable. Documents are thin ceramic slips with softly uneven rims; relationships are a fine cobalt thread. This suits a tiny-business owner reconstructing a messy history because the surface lowers anxiety while the thread makes provenance visible. It must not resemble an accounting dashboard or a generic SaaS landing page.

The treatment is intentionally single-mode. A fixed pale glacial field makes printed casefiles and on-screen evidence share one visual language; there is no dark theme because it would turn the ceramic material metaphor into glossy software chrome.

## Palette

- `ice-25 #F7F9F7` — page field, like cold daylight on porcelain.
- `porcelain #FEFFFC` — primary work surface.
- `frost #E8EEEA` — quiet dividers and recessed controls.
- `slate #1E2927` — main copy (13.6:1 on ice).
- `shale #52615E` — secondary copy (6.2:1 on ice).
- `cobalt #315B75` — primary action and thread (6.6:1 on porcelain).
- `cobalt-deep #244658` — active action and focus support.
- `moss #3E6751` — linked/resolved state, always paired with text or icon.
- `ochre #8A5B19` — ambiguous/unlinked state, always paired with text or icon.
- `clay #9A4037` — destructive/error state.

All text and control combinations meet WCAG AA. State is communicated by words, shape, and color together.

## Type and numbers

- Headings: `Georgia`, `Cambria`, serif — restrained editorial warmth, available locally with no font transfer.
- Interface/body: `Inter`-like system stack (`ui-sans-serif`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif) — crisp at small sizes and zero network cost.
- Body 16px minimum, 1.55 leading; labels 13px only when supplemental; values use tabular figures.
- Scale: 13 / 16 / 20 / 28 / clamp(36–58) px. One h1 only.

## Spacing and layout

An 8px base rhythm with 4px for optical adjustments. Main widths are 1180px (workbench) and 720px (reading). Controls are at least 44px high. On phones the persistent rail becomes a compact header, the document editor becomes a bottom sheet-like full-width section, and secondary descriptions collapse before primary amounts do.

Independent work areas use thin ceramic plates: 16px radius, a cool 1px rim, and a short diffuse shadow. Related content groups through space rather than nested cards. The trail itself is one continuous vertical cobalt line; each document interrupts it like a label tied onto evidence.

## Interaction grammar

- “Add record” opens the editor from the workbench origin; editing preserves position and uses explicit Save/Cancel actions.
- Records sort by source date. Selecting a record reveals its exact source note and linked-document explanation.
- Totals never claim an ambiguous match: unallocated values remain visibly ochre, and every derived number lists the records that contribute.
- CSV import is a staged review: choose file → map/tolerate rows → review accepted and rejected rows → import. Rejected source rows remain downloadable.
- Destructive reset requires naming the consequence. Individual deletion has a short Undo window.
- Free users can create, import, inspect, and export their data as JSON/CSV. The paid one-time unlock adds the polished print/PDF casefile, without gating ownership or accessibility.

## Motion policy

Transitions last 160–240ms and animate only opacity and transform. New evidence rises 6px from the thread; toasts enter from the lower edge; no ambient or looping animation. With `prefers-reduced-motion: reduce`, all spatial movement is removed and state changes are immediate. The same hierarchy remains through scale, rim, and spacing.

## Original asset plan and provenance

The hero is an original AI-generated still-life: five pale ceramic document shards laid along a fine cobalt thread on frosted glass, with one ochre fragment offset to suggest an unresolved amount. It clarifies the core transaction-chain model without pretending to show the product UI. The crop is wide, quiet on the left for copy, and contains no people, brands, text, logos, currency symbols, or watermark. It ships as responsive AVIF/WebP with explicit dimensions; source candidates and prompt sidecars live in `assets/src/`.

Prompt sheet: “Editorial product still life, overhead three-quarter view, hand-cast minimal porcelain document tiles with subtle uneven ceramic rims, five tiles joined by one taut ultrafine cobalt-blue thread, one smaller warm ochre ceramic chip offset but visibly near the chain, on translucent frosted glass over pale glacial green, quiet northern window light, fine contact shadows, museum catalog precision, generous negative space on left, 50mm lens, restrained palette of porcelain white glacial gray cobalt and one ochre accent, tactile realistic materials, no text, no letters, no numbers, no currency symbols, no people, no hands, no logos, no watermark, no UI screenshot, no gradient.”

Generation: Azure OpenAI image generation via the factory `gen-image.sh`, deployment `factory-image`, generated 2026-08-28. Assets are original to Deal Thread. Every candidate is visually reviewed for text artifacts, unintended symbols, seams, and palette consistency before use. CSS icons are hand-authored simple line marks and carry no third-party provenance.

`public/assets/deal-thread-social.jpg` is a 1200×630, 47 KB center crop derived locally from the reviewed original hero asset for Open Graph and Twitter previews. It introduces no new imagery or third-party asset.
