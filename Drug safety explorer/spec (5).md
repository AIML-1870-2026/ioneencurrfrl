# spec.md — Drug Safety Explorer

## Project Overview

A single-page web application that lets users explore FDA drug safety data in an
approachable, educational way. Users can search for any two drugs and compare them
side-by-side using live data from the OpenFDA API, with built-in contextual help to
make complex safety data understandable to a general audience.

---

## Design & Visual Style

- **Warm and approachable** — soft, muted color palette (warm whites, soft creams,
  dusty rose accents, muted teals). Nothing harsh or overly clinical.
- Clean sans-serif typography (e.g., Inter or DM Sans via Google Fonts).
- Rounded corners, subtle shadows, gentle transitions — friendly and inviting.
- Fully responsive: works on desktop and mobile.
- No pre-populated drug pair on load — users start fresh and enter their own drugs.

---

## Core Features

### 1. Drug Search Interface

- Two side-by-side search inputs labeled **"Drug A"** and **"Drug B"**.
- Each input has **autocomplete** powered by the `/drug/label.json` endpoint —
  as the user types, matching drug brand/generic names appear in a dropdown.
- A prominent **"Compare Drugs"** button triggers all API calls simultaneously.
- Clear loading states (spinner or skeleton) while data is being fetched.
- Graceful error handling: if a drug is not found or returns no data, display a
  friendly message (e.g., "No results found for 'xyz' — try a generic name").

---

### 2. Comparison Dashboard (Tabbed Interface)

After a search, results appear in a **tabbed layout** with three tabs per drug,
displayed side-by-side. Tabs:

#### Tab 1 — Drug Label
Pull from `/drug/label.json`. Display:
- Drug name, manufacturer
- Warnings & boxed warnings (highlight boxed warnings visually — they're the most severe)
- Contraindications
- Drug interactions section
- Adverse reactions listed in the label

#### Tab 2 — Adverse Events (FAERS)
Pull from `/drug/event.json`. Display:
- Total number of FAERS reports found (with a note about voluntary reporting bias)
- **Bar chart** of the top 10 most commonly reported adverse reactions (use Chart.js)
- **Timeline chart** showing report counts over time (by year)
- Breakdown of serious vs. non-serious reports
- Note about what FAERS data can and cannot tell you (see Help Popups below)

#### Tab 3 — Recall History
Pull from `/drug/enforcement.json`. Display:
- Total recall count for that drug
- List of recalls sorted by date (most recent first), each showing:
  - Recall date
  - Reason for recall
  - **Color-coded classification badge**:
    - Class I → red (serious danger)
    - Class II → orange (may cause temporary harm)
    - Class III → yellow (unlikely to cause harm)
  - Recalling firm
- If no recalls found: display a reassuring message ("No recalls on record for this drug.")

---

### 3. Help Buttons & Educational Popups (Stretch Challenge #1)

Sprinkle small **ⓘ info buttons** throughout the interface, next to each section
header. When clicked, a modal opens with plain-language educational context.

Required help modals:

| Trigger Location | Modal Title | Content Summary |
|---|---|---|
| Next to "Adverse Events" header | How to Interpret Adverse Event Data | Explain voluntary reporting, that correlation ≠ causation, that popular drugs get more reports |
| Next to recall classification badges | Understanding Recall Classifications | Define Class I, II, III with real-world examples |
| Next to "Drug Label" header | What Drug Labels Actually Tell You | Explain FDA-approved labeling, when it's written, what it covers |
| Next to FAERS report count | Why Some Drugs Have More Reports | Explain reporting bias and market share |
| Header area (general) | About This Tool | Disclaimer, data sources, when to consult a professional |
| Somewhere prominent | Dangerous Drug Pairs to Know | Highlight Warfarin + NSAIDs, MAOIs + serotonergic drugs, Methotrexate + NSAIDs |

Modal design requirements:
- Backdrop blur behind modal
- Smooth fade-in animation
- Dismissible by clicking outside, pressing Escape, or a close (×) button
- Written in plain language — no jargon

---

### 4. Visual Storytelling (Stretch Challenge #2)

Use **Chart.js** for all charts. Required visualizations:

- **Adverse Event Bar Chart** — top 10 reactions, horizontal bars, color-coded by
  frequency (darker = more reports). One chart per drug, shown side by side.
- **Report Timeline** — line chart showing FAERS report counts by year for each drug,
  both drugs overlaid on the same chart for easy comparison.
- **Severity Pie/Donut Chart** — proportion of serious vs. non-serious reports per drug.
- **Recall Classification Breakdown** — small stacked bar or donut showing how many
  recalls per class (if recall data exists).

All charts should have:
- Axis labels and chart titles
- Tooltips on hover
- Legend where applicable
- Warm color palette consistent with the overall design

---

### 5. Drug Class Exploration (Stretch Challenge #3)

Add a **"Explore a Drug Class"** section below the main comparison tool.

- Dropdown menu of common drug classes:
  - SSRIs (antidepressants): fluoxetine, sertraline, paroxetine, escitalopram, citalopram
  - Statins (cholesterol): atorvastatin, simvastatin, rosuvastatin, lovastatin
  - ACE Inhibitors (blood pressure): lisinopril, enalapril, ramipril, captopril
  - NSAIDs (pain/inflammation): ibuprofen, naproxen, celecoxib, diclofenac

- When a class is selected, fetch FAERS report counts and recall counts for each drug
  in the class and display a **grouped bar chart** comparing them.
- Include a brief description of what the drug class does and why comparing safety
  profiles within a class is clinically meaningful.
- Add a contextual help button explaining that within-class differences in adverse
  event reports can reflect differences in popularity, not just safety.

---

## Required Disclaimers & Attribution

Include the following — both in the page footer and in the "About This Tool" modal:

> **Educational Use Only:** This tool is intended for educational purposes only and
> does not constitute medical advice. Always consult a licensed healthcare professional
> before making any decisions about medications.

> **OpenFDA Attribution:** This product uses publicly available data from the U.S. Food
> and Drug Administration (FDA). FDA is not responsible for the product and does not
> endorse or recommend this or any other product.

---

## Technical Requirements

- **Single-page application** — one HTML file with embedded or linked CSS and JS
- **No backend** — all API calls are client-side fetch requests to OpenFDA
- **No API key required** — OpenFDA allows up to 240 requests/min without authentication
- **Chart.js** loaded via CDN for all data visualizations
- Deployed to **GitHub Pages**

### Key OpenFDA Endpoints

```
Base URL: https://api.fda.gov

Drug label:      /drug/label.json?search=openfda.brand_name:"DRUGNAME"&limit=1
Adverse events:  /drug/event.json?search=patient.drug.medicinalproduct:"DRUGNAME"&count=patient.reaction.reactionmeddrapt.exact&limit=10
Recalls:         /drug/enforcement.json?search=brand_name:"DRUGNAME"&limit=100
Autocomplete:    /drug/label.json?search=openfda.brand_name:"QUERY*"&limit=8
```

### Error Handling

- 404 / no results → friendly "not found" message per section
- Network error → "Unable to load data. Please check your connection."
- Partial results (e.g., label found but no recalls) → show what's available, note
  what's missing
- Empty string submission → prompt user to enter a drug name

---

## File Structure

```
drug-safety-explorer/
├── index.html       ← entire app lives here
├── style.css        ← all styles (warm palette, typography, layout)
├── app.js           ← all JavaScript (API calls, rendering, chart logic)
└── spec.md          ← this file
```

---

## Out of Scope

- No user accounts or saved searches
- No backend server or database
- No drug-drug interaction checking (DDInter/DrugBank) — OpenFDA only
- No prescription or dosage recommendations
