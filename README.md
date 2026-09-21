# Fleet Note Triage

This Fleet Note Triage app turns free-text vehicle issue reports into prioritised, filterable notes for an operations team.

## Getting started

### Prerequisites

- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- Node.js 22 with npm
- GNU Make
- An OpenAI API key to submit new notes

### Run locally

1. Install the dependencies, create local environment files, run the database migrations, and add sample notes:

   ```bash
   make setup
   ```

2. Add your OpenAI API key to `backend/.env`:

   ```dotenv
   OPENAI_API_KEY=your-api-key
   ```

3. Start the backend and frontend:

   ```bash
   make dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

- The API runs at [http://localhost:8000](http://localhost:8000)
- Interactive API docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

Stop both development servers with `Ctrl+C`.

The seeded dashboard and status controls work without an OpenAI API key. Submitting a new note requires a valid key.

## Useful commands

```bash
make seed       # Add any missing sample notes
make test       # Run backend and frontend tests
make lint       # Run Ruff and ESLint
make typecheck  # Run Pyright
```

## How it works

- The Next.js frontend submits rough technician notes to the FastAPI API.
- OpenAI generates a short title and assigns a fixed category and priority. I used OpenAI's "Structured Outputs" feature, with descriptions on the Pydantic schema to guide the LLM.
- The application saves actionable notes to SQLite along with their original text, status, and timestamps.
- The dashboard lists urgent notes first and supports filtering, sorting, pagination, resolving, and reopening.
- `NoteExtractor` and `NoteRepository` interfaces isolate extraction and persistence. I did this primarily because I prefer using fakes via DI for tests rather than using mocks.
- Alembic manages schema changes, whilst generated types and Zod schemas validate the frontend API boundary.
- Automated tests use fakes and never call OpenAI.

## Decisions and trade-offs

- I decided to use an LLM as category and priority often depend on the meaning and context of the whole note. The obvious alternative was a keyword or rules-based classifier, but that could become brittle as technicians describe the same issue in different ways.
- I limited the model to a fixed schema. The application controls IDs, timestamps, status changes, and storage.
- Each submission creates one note. If the text contains several issues, the prompt selects the issue with the greatest operational impact.
- I allow duplicate text because two reports with the same wording may describe separate incidents.
- I used synchronous extraction and SQLite to keep the first version small and easy to run.

## Deliberately out of scope

- I initially considered allowing one submission to produce many notes, but it raised questions about partial failure, confirmation, and storage. I decided to mark this as out of scope, and instead put deliberate rules in place in case the submitted text contained several issues.
- I did not add idempotency keys to note creation. A complete solution would need stored request keys and rules for retries, expiry, and changed payloads.
- I did not add a deterministic rules-based fallback. I would want test data before deciding when rules should replace or override the LLM.
- Failed submissions remain in the form but are not stored. A stored backlog would need pending states, retry rules, and a review screen.

## With another 2–3 days

- When a submission fails (for example, because OpenAI is unavailable), prompt manual submission via a modal with pre-populated fields. This would ensure the app remains usable when the LLM is unavailable.
- Let users correct/edit the generated title, category, and priority. These corrections could be stored alongside the original result to inform LLM eval test cases with real-world expected answers.
