# Science Experiment Generator — spec.md

## Project Overview
A single-page web app that generates grade-appropriate science experiments
based on supplies the user has on hand. The user selects a grade level and
enters available materials; the app uses OpenAI to generate a complete
experiment with instructions.

## Tech Stack
- Single index.html file — HTML, CSS, and JavaScript all in one file
- No server, no Node.js, no npm
- Runs entirely in the browser
- Deploy to GitHub Pages

## API
- OpenAI chat completions API only (no Anthropic — CORS blocks browser requests)
- Unstructured (free-form) responses — no JSON schema needed
- Render the model's markdown output as formatted HTML using marked.js (CDN)
- API key loaded from a .env file upload — read once into memory, never stored or persisted

## UI / Inputs
1. **Grade Level dropdown** — options: K-2, 3-5, 6-8, 9-12
2. **Available Supplies** — textarea where user lists supplies on hand
3. **Generate Experiment button** — triggers the API call
4. **.env file uploader** — loads OpenAI API key into memory (in-memory only, never persisted)
5. **Results area** — renders the model's markdown response as formatted HTML

## Prompt Design
System prompt:
> "You are a science experiment designer for K-12 students. Given a grade
> level and a list of household supplies, generate a fun, safe, and
> educational science experiment. Include: a title, the scientific concept
> being demonstrated, a materials list, step-by-step instructions, and
> what to observe or measure."

User message should include the selected grade level and the supplies list.

## Reference Implementation
The temp/ folder contains my complete LLM Switchboard project (HTML, CSS,
and JS files). This is NOT part of the current project — do not include it
in the final build or deployment.

Use it as a reference for:
- How to parse a .env file for API keys (in-memory only)
- The fetch() call structure for OpenAI's chat completions API
- Error handling patterns for failed API requests
- The general approach to building a single-page LLM tool

Ignore these Switchboard features (not needed here):
- Anthropic integration (this project is OpenAI-only)
- The model selection dropdown / provider switching
- Structured output mode and JSON schema handling

This project uses unstructured (free-form) responses only.
Render the model's markdown output as formatted HTML.

## Stretch Challenges

### 1. Save and Display Previously Generated Experiments
Keep a history of all generated experiments in the current session. Display
them in a scrollable list or accordion below the results area so the user
can revisit past experiments without regenerating them.

### 2. Predefined Supply List with Quick-Select
Include a predefined list of common household supplies (e.g., vinegar,
baking soda, balloons, paper clips, rubber bands). Display them as
clickable buttons or checkboxes so the user can quickly add them to the
supplies field without typing.

### 3. Images of Common Supplies
Display a small image next to each predefined supply item for visual
reference. This helps younger students identify materials at a glance.

### 4. Supply Substitution Feature
After an experiment is generated, include a button that lets the user flag
a supply they don't have. The app will send a follow-up prompt to OpenAI
asking for a suitable substitution, and display the suggestion inline.

### 5. Printable Observation Worksheets
After an experiment is generated, provide a "Print Worksheet" button that
opens a print-friendly version of the page containing the experiment title,
materials list, steps, and blank lines for the student to record their
observations and results.

### 6. Difficulty Ratings
Display a difficulty rating (e.g., Easy / Medium / Hard) for each generated
experiment. This can either be parsed from the model's response or generated
as a separate follow-up API call asking the model to rate the experiment's
complexity for the selected grade level.

## Deployment
- Single index.html file
- Deploy to the GitHub organization for this class via GitHub Pages
