# Upgrade UI Task List

> Scope audited against the current implementation in `/upgrade`, `/upgrade/[slug]`, upgrade blog data, and the proposal preamble table.

## Goal

Clean up navigation, naming, section ordering, and upgrade/EIP inclusion presentation across:

- `/upgrade`
- `/upgrade/[slug]` with special handling for `/upgrade/pectra`
- per-EIP proposal pages

---

## 1. Upgrade Hub (`/upgrade`)

### 1.1 Make the `21 Upgrades` card navigate to the interactive upgrade chart

- Priority: P1
- Outcome: Clicking the `21 Upgrades` total card should navigate to `#network-upgrades-chart`.
- Where:
  - `src/app/upgrade/_components/upgrade-stats-cards.tsx`
  - `src/app/upgrade/page.tsx`
- Notes:
  - The destination anchor already exists as `sectionId="network-upgrades-chart"` in the page header.
  - The current stats card is visual-only and needs link/button behavior.

### 1.2 Replace `Total Core EIPs` with `EIPs Deployed`

- Priority: P1
- Outcome: Rename the bottom stats card label from `Total Core EIPs` to `EIPs Deployed`.
- Where:
  - `src/app/upgrade/_components/upgrade-stats-cards.tsx`
- Notes:
  - Update the supporting copy too: it currently says `Implemented in upgrades`, which should align with `deployed` wording instead of `implemented`.

### 1.3 Add a paired `Hard Fork Meta EIPs` card next to `EIPs Deployed`

- Priority: P1
- Outcome: The bottom row should expose both:
  - `EIPs Deployed`
  - `Hard Fork Meta EIPs`
- Where:
  - `src/app/upgrade/_components/upgrade-stats-cards.tsx`
  - `src/app/upgrade/_components/network-upgrades-chart.tsx`
  - `src/data/network-upgrades.ts`
- Notes:
  - Current chart data already distinguishes core counts and meta EIPs by date.
  - The stats layout likely needs to change from one full-width bottom card to two cards or a card + action panel.

### 1.4 Make the bottom cards drive a detail table below the stats area

- Priority: P1
- Outcome: Clicking either bottom card should reveal a table under the cards that shows both:
  - core EIPs
  - meta EIPs
- Where:
  - `src/app/upgrade/_components/upgrade-stats-cards.tsx`
  - `src/data/network-upgrades.ts`
- Notes:
  - Best behavior looks like a local filter/toggle rather than page navigation.
  - The table should clearly distinguish category, upgrade name, date, and linked EIP number.
  - Since both card types must be visible in the table flow, define whether click means:
    - filter to one type, or
    - open a shared table with active tab/highlight.

### 1.5 Rename the two timeline sections for clearer distinction

- Priority: P2
- Outcome:
  - `Ethereum Upgrade Timeline` -> `Ethereum Upgrade Timeline (by timeline)`
  - `Network Upgrade Timeline` -> `Network Upgrade Timeline (by timeline)`
- Where:
  - `src/app/upgrade/page.tsx`
- Notes:
  - The current two headings are easy to confuse because both describe timeline content.
  - Also review matching image `alt`/description copy so naming stays consistent.

### 1.6 Replace the inclusion process image

- Priority: P2
- Outcome: Swap the current inclusion-process asset with the updated image.
- Where:
  - `public/upgrade/eip-incl.png`
  - `src/app/upgrade/page.tsx`
- Notes:
  - The page already renders `/upgrade/eip-incl.png`; if the new asset keeps the same filename, only the file needs replacement.
  - If dimensions/aspect ratio change, confirm the `object-cover` treatment still preserves legibility.

---

## 2. Upgrade Detail Page (`/upgrade/[slug]`)

### 2.1 Reorder `/upgrade/pectra` sections

- Priority: P1
- Outcome: On `http://localhost:3000/upgrade/pectra`, the section order should be:
  1. About
  2. EIP Composition Timeline
  3. Prague/Electra (Pectra) EIPs
  4. Complete list of Ethereum Improvement Proposals in this upgrade
  5. Related Articles
- Where:
  - `src/app/upgrade/[slug]/page.tsx`
  - `src/app/upgrade/_components/upgrade-timeline-chart.tsx`
  - `src/app/upgrade/_components/upgrade-eips-showcase.tsx`
  - `src/app/upgrade/_components/upgrade-blog-carousel.tsx`
- Notes:
  - Current order is:
    - timeline
    - about
    - related articles
    - EIPs showcase
  - This needs to be restructured, at least for `slug === 'pectra'`, and possibly generalized for all upgrade pages if desired.

### 2.2 Clarify the Pectra EIP section heading

- Priority: P2
- Outcome: Present the EIP section as `Prague/Electra (Pectra) EIPs` before the full list copy.
- Where:
  - `src/app/upgrade/_components/upgrade-eips-showcase.tsx`
  - `src/app/upgrade/[slug]/page.tsx`
- Notes:
  - The current heading is generic: `{upgradeName} EIPs`.
  - This may require a slug-aware heading override for paired upgrades like Pectra.

### 2.3 Show related articles in latest-first order

- Priority: P1
- Outcome: `Related Articles` should render newest entries first.
- Where:
  - `src/data/upgrade-blogs.ts`
  - `src/app/upgrade/[slug]/page.tsx`
  - `src/app/upgrade/_components/upgrade-blog-carousel.tsx`
- Notes:
  - `getUpgradeBlogs(slug)` currently returns arrays in authored order with no date metadata or sort step.
  - To make this reliable, add a `publishedAt` field and sort before rendering instead of depending on manual array order.
  - `pectraPosts` currently appear mixed and include at least one malformed item that should be validated while touching this data.

---

## 3. Per-EIP Proposal Page

### 3.1 Show only the latest inclusion stage in the preamble table

- Priority: P0
- Outcome: In the proposal preamble table, `Inclusion Status` should show only the latest upgrade inclusion stage for the EIP, such as:
  - `Included`
  - `SFI`
  - `CFI`
  - `DFI`
  - `PFI`
- Where:
  - `src/app/(proposal)/[repo]/[number]/page.tsx`
  - `src/server/orpc/procedures/upgrades.ts`
- Notes:
  - Current behavior lists all linked upgrade buckets for an EIP when `upgrades.length > 0`.
  - The request is to reduce this to the latest relevant inclusion-stage value rather than a comma-separated history.
  - Define “latest” explicitly:
    - latest by upgrade timeline date
    - latest by `updated_at`
    - latest by current bucket snapshot

### 3.2 Normalize inclusion-stage labels to the desired short forms

- Priority: P1
- Outcome: Ensure the preamble and related UI surfaces use the expected naming:
  - `Included`
  - `SFI`
  - `CFI`
  - `DFI`
  - `PFI`
- Where:
  - `src/app/(proposal)/[repo]/[number]/page.tsx`
  - `src/app/upgrade/_components/upgrade-timeline-chart.tsx`
  - any shared formatter added during implementation
- Notes:
  - The timeline chart already uses short labels in its legend.
  - The proposal page currently capitalizes raw bucket strings like `scheduled` or `considered`, so the terminology is inconsistent across surfaces.

---

## 4. Data and QA Follow-Ups

### 4.1 Validate upgrade article data while adding latest-first sorting

- Priority: P1
- Outcome: Clean article records so the carousel has valid links and sortable publish dates.
- Where:
  - `src/data/upgrade-blogs.ts`
- Notes:
  - `pectraPosts` contains a malformed `link` value for `Sepolia Pectra Incident Update` that looks like article text instead of a URL.
  - Sorting work should include a quick content audit for all manually curated upgrade post arrays.

### 4.2 Verify anchor and interaction behavior after the stats-card changes

- Priority: P2
- Outcome: Confirm the clickable stats cards do not regress layout or keyboard accessibility.
- Where:
  - `src/app/upgrade/_components/upgrade-stats-cards.tsx`
  - `src/app/upgrade/page.tsx`
- Notes:
  - Check mouse click, keyboard activation, focus styles, and mobile behavior.
  - Confirm the `#network-upgrades-chart` jump lands in a sensible viewport position.

### 4.3 Re-test section order and content priority on `/upgrade/pectra`

- Priority: P2
- Outcome: Confirm the page reads in the intended editorial order and that the related-articles section remains last.
- Where:
  - `src/app/upgrade/[slug]/page.tsx`
- Notes:
  - This is especially important because the current implementation uses one generic layout for all upgrade pages.
  - Decide whether Pectra gets a special-case layout or whether the new order should become the default for all upgrade detail pages.

---

## Suggested Implementation Order

1. Fix per-EIP inclusion-stage logic and label consistency.
2. Rework `/upgrade` stats cards, click behavior, and the supporting table.
3. Rename timeline headers and swap the inclusion-process image.
4. Reorder `/upgrade/pectra` and update its EIP/article sections.
5. Add article dates and latest-first sorting, then QA the curated upgrade content.
