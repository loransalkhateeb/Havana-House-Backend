# Repository Guidelines

## Agent Workflow

Treat this file as the source of truth for agent behavior in this repository. Prefer concrete, executable commands over generic advice, and keep instructions in sync with `package.json`, Prisma schema workflows, and the current folder structure. If a command or process changes, update this file in the same task so future agents do not inherit stale instructions.

Before editing, inspect the existing module, validator, and route flow instead of introducing parallel patterns. Prefer small, targeted changes that match the repository's current structure. After code changes, run the narrowest relevant validation first, then run the broader required checks for the touched area.

Do not edit existing Prisma migration files and do not generate new migration files. If a task requires a database schema change, update `prisma/schema.prisma` only when requested and leave migration creation to the user.

When a task originates from a Linear issue delegated to Codex, treat the Linear title, description, labels, and comments as the product brief. Capture assumptions explicitly when the issue is underspecified instead of inventing product behavior. If the task is triggered by the repository's Linear Codex automation, expect an `@Codex` comment that already contains a condensed execution prompt and use it as the working brief alongside the issue thread.

When a task in the Linear delegation workflow involves generating or optimizing a prompt, build that prompt from the Linear issue context plus the repository context you inspected for the task. In the final response, explain how the optimized prompt was written, whether it was based on the codebase, and which specific issue details, files, modules, patterns, or workflows informed it. Do not present the prompt as repository-optimized unless you actually inspected and used relevant codebase context.

Automatic Postman/MySQL API validation is temporarily disabled by default. Only run the Postman collection update, request execution, and MySQL inspection workflow when the user explicitly asks for it in the current task.

<!--
When implementing or fixing a feature that adds, edits, or debugs HTTP APIs, agents should treat the API workflow as part of the default task unless the user explicitly opts out. This applies to new endpoints, changed endpoints, and bug fixes on existing endpoints. After backend code changes are in place, agents should:

1. Use the repo-local Codex skill `postman-request-trace` to create or update the relevant Postman collection entries for the new or changed endpoints through the Postman MCP server.
2. Use the same `postman-request-trace` skill to send representative Postman MCP requests for those endpoints and print the effective tool call details in commentary, including URL, path params, query params, and body payloads when available.
3. Use the repo-local Codex skill `mysql-query-trace` to inspect the MySQL MCP server after those requests and print the exact SQL or SQL-equivalent command plus the resulting rows, schema details, or table summaries relevant to the feature.

Agents must execute this API workflow before closing the task whenever the required tools or a safe local fallback are available. Do not stop after code changes, unit tests, or collection edits alone if request execution and database inspection can still be run.

If the Postman MCP surface in the current session can edit collections but cannot send HTTP requests directly, agents should still update the target Postman collection first and then use the closest repository-aligned local HTTP execution path to validate the endpoint, such as the local server with `curl` against the same route, headers, variables, and payload shape used by the collection.

If API request execution fails because the response says the bearer token is expired, invalid, or unauthorized due to token age, agents should try to renew the token before treating the request as blocked. For cpanel routes, use the existing cpanel login APIs already maintained in the repository or the `hayder v4.6` Postman collection to obtain a fresh bearer token. For business routes, use the existing business login APIs already maintained in the repository or the same collection to obtain a fresh bearer token. After renewing the token, rerun the blocked API request with the updated Authorization header before concluding that request execution failed.

When renewing tokens for API workflow validation, agents should prefer the existing login request entries and environment variable conventions already present in the target Postman collection instead of inventing ad hoc auth flows. If the login endpoint itself is broken, missing required credentials, or unavailable in the current environment, agents must report that specific blocker and the exact login request or command they attempted.

If any part of the API workflow cannot be completed, agents must say exactly which step was blocked, what command or tool was attempted, and why it could not proceed. Do not silently skip request execution, prerequisite-data setup, or database inspection.

Before sending Postman requests for a feature, agents should check whether required prerequisite data is missing from the local database. This includes missing categories, subcategories, packages, business account records, feature-specific reference data, and other rows the API depends on. If required data is missing, agents should create or update that local data before running request validation.

When prerequisite data is missing, prefer the safest repository-aligned path in this order:

1. Use existing application APIs, services, seed scripts, or Prisma workflows already used by the repository.
2. If no repository-native path exists or it would be unreasonably heavy for the task, use the MySQL MCP server to inspect the missing rows and create the necessary local records with explicit SQL statements.

Agents must never assume that Postman collection changes or Postman request execution will automatically insert prerequisite reference data into the local database. Postman requests only create data when the called API actually performs those writes.

For Postman collection work in this repository, agents should target the `hayder v4.6` collection by default. Reuse the same variables, structure, naming style, folder layout, authorization setup, and request formatting conventions already present in that collection. When adding a new request, prefer updating the existing collection rather than creating a parallel collection unless the user explicitly asks for a separate one.

For Postman environment selection in this repository, Codex is forbidden from using the `mondoway_dev` environment for any request execution, token refresh, smoke check, or API validation workflow. Treat `mondoway_dev` as off-limits because it can affect the shared dev server. When Postman variables are needed for local validation, use `mondoway_local` only unless the user explicitly overrides this restriction in the current conversation.

When following this API workflow, agents should make a reasonable effort to discover required Postman identifiers such as workspace IDs, collection IDs, request IDs, and environment IDs before asking the user. Ask only when the identifiers cannot be discovered safely from the available tools or repository context.

If the required Postman MCP or MySQL MCP tools are unavailable in the current Codex session, say so explicitly and continue with the parts of the task that can still be completed. Do not silently skip the Postman or database inspection workflow.
-->

## Project Structure & Module Organization

Runtime code lives in `src/`. `src/index.js` boots the HTTP server and Socket.IO bridge, while `src/app.js` wires Express middleware. Domain logic sits in `src/modules/<domain>` with the established `<domain>.<role>.js` naming (`restaurant.service.js`, `restaurant.controller.js`). Shared helpers stay in `src/services/`, `src/utils/`, and `src/middlewares/`. Configuration, logging, and permissions belong to `src/config/`. Prisma schema and seeds are under `prisma/`; regenerate the client whenever the schema changes. Keep infrastructure assets such as `Dockerfile` and `docker-compose.yaml` at the repository root.

## Build, Test, and Development Commands

Install dependencies via `npm install`. Use `npm run start-dev` for a nodemon reload loop and `npm run start` for a production-like boot. Lint with `npm run lint` or auto-fix via `npm run lint:fix`. Enforce formatting through `npm run prettier` / `npm run prettier:fix`. Refresh Prisma typings with `npm run prisma:generate`, push schema changes using `npm run prisma:db:push`, and reseed fixtures through `npm run prisma:seed`. Use `npm run prisma:seed:business-demo` to create local demo categories, subcategories, packages, business accounts, branches, and app users around the seeded business app types. Compose services locally with `docker-compose up --build`.
Use `Dockerfile` for the existing general/dev container flow. Use `Dockerfile.prod` for Jenkins or production image builds when you need a smaller runtime image with production dependencies only.
For Docker images, keep Prisma `binaryTargets` set to `["native"]` unless there is a verified cross-platform runtime requirement. Multi-arch builds should generate Prisma inside each target image instead of baking in a different distro-specific engine target. Alpine-based images are acceptable when Prisma is generated in the target container at runtime.

When test tooling is present, expose it through `npm test` and prefer running `npm test -- <pattern>` for focused verification. If a task adds the first unit tests or introduces a new test runner configuration, add or update the matching `npm test` script as part of the same change so test execution is standardized for future work.

## Coding Style & Naming Conventions

ES2020 JavaScript is linted with Airbnb Base and `eslint-plugin-security`. Follow the Prettier defaults: 2-space indentation, single quotes, trailing commas, and 125-character line width. Keep modules focused, naming files `<domain>.<role>.js`, and export shared singletons from `src/singletons/`. Read environment variables only through `src/config/config.js`.
Use meaningful names and stay DRY, but keep solutions simple—avoid adding new helpers unless they are reused or clearly clarify very complex logic. Do not introduce helpers that merely duplicate schema validation behaviour.
If a route already uses Joi validation middleware, do not repeat the same field-level validation checks inside controller/service layers unless the service is intentionally public and called from non-validated entry points.

**Comments:** Only add comments when the code's intent is not immediately clear from the function/variable names. Avoid step-by-step workflow comments ("Step 1", "Step 2"). Document complex business logic, security considerations, and non-obvious decisions. Prefer JSDoc for public APIs and keep inline comments minimal.

## Testing Guidelines

Service changes require unit tests. When creating a new `*.service.js` file or editing an existing service, add or update a colocated spec in the same domain folder using the `*.service.spec.js` naming convention, for example `src/modules/orders/order.service.spec.js`. Do not treat service test coverage as optional for those changes.

Keep service unit tests isolated and fast. Mock Prisma, Redis, HTTP clients, queues, storage, Socket.IO emitters, and other external dependencies so the test validates service behavior without relying on network access, real background jobs, or shared mutable infrastructure. Prefer focused assertions around return values, thrown errors, branching rules, and collaborator calls.

When creating or updating service unit tests, print the key debug snapshots during execution so the runtime behavior is visible from the test log. At minimum, log the service input, the mocked DB or collaborator response, the actual service output, and the expected output for each main test case.

Run the tests you add or modify before finishing the task. Prefer `npm test -- <pattern>` when available; otherwise use the project runner directly, such as `npx jest src/modules/orders/order.service.spec.js`. If the task introduces or updates test infrastructure, make sure the repository exposes a working `npm test` command and use it in the final verification. Log any manual API or Socket.IO checks only as a supplement, not a substitute, for required service unit tests.

Agents must always report test status explicitly in the final response. Include the exact validation commands that were run and whether each one passed, failed, or was not run. Do not omit test results, even for documentation-only tasks.

When tests are run, do not only say that `node --test ...` or any equivalent command passed. Also include the relevant test log output in the final response so the user can see which test file, suite, or test cases passed. Summarize or quote the important passing lines from the runner output, keeping them concise but specific enough to show the executed test cases.

## Commit & Pull Request Guidelines

**CRITICAL FOR AGENTS: NEVER commit changes using git. ONLY generate commit messages.**

Whenever you edit the code, compose a single-line commit message summarizing the change and include it at the end of your response. Agents must NEVER run `git add`, `git commit`, or `git push` commands. The user will handle all git operations manually.

Commit messages should be imperative and present tense (`Add receivingType validation`). Use `npm run commit` for Commitizen and the Conventional Commit flow when practical. Each pull request should describe the change set, reference issues, highlight new environment variables, and include relevant logs or screenshots. Before requesting review, rerun linting, regenerate Prisma clients after schema edits, and note how you validated the changes.

## Configuration & Secrets

Environment variables load from `.env` via Joi validation (`src/config/config.js`). Document new keys, supply safe defaults, and never commit secrets. Use the checked-in `private.key` and `public.key` as placeholders only and rotate credentials through your hosting platform.


You are a senior backend engineer specializing in Node.js, Prisma ORM, and MySQL.

Your role is to review backend code like a senior reviewer in a production system.

🎯 Review Goals

Focus on:

correctness
data integrity
performance
security
scalability
maintainability
🧱 Prisma & Database Review

Always check:

1. Schema & Data Integrity
Are Prisma models aligned with business logic?
Are required fields correctly marked?
Are nullable fields justified?
Any missing indexes?
Any incorrect relations?
2. Relations & Constraints
Are relations properly defined (1:1, 1, N)?
Are onDelete / onUpdate behaviors correct?
Any risk of orphan records?
Any risk of cascading data loss?
3. Queries & Performance
Avoid N+1 queries
Use select instead of full object when possible
Avoid unnecessary include
Check for inefficient loops with DB calls
Suggest batching or transactions if needed
4. Transactions
Are critical operations wrapped in transactions?
Is data consistency guaranteed?
Any risk of partial updates?
🔐 Security & Validation
Is input validation implemented (Joi or similar)?
Are unsafe inputs reaching the database?
Any risk of SQL injection (raw queries)?
Missing authorization checks?
Any sensitive data exposed?
⚙️ Business Logic
Does the logic match expected behavior?
Are edge cases handled?
Any incorrect assumptions?
Any duplicated logic?
🧠 Debugging Awareness
Identify potential bugs (not only current ones)
Highlight fragile logic
Point out race conditions
Check async/await correctness
🧪 API Layer
Are responses consistent?
Proper status codes?
Clear error messages?
Any missing validation before DB calls?
🧹 Code Quality
Naming clarity (variables, functions)
Function size and responsibility
Readability and structure
Avoid deeply nested logic
📌 Review Output Format (IMPORTANT)

Write comments like a GitHub PR review:

Severity: blocker / major / minor / nit
File/Function:
Issue:
Why it matters:
Suggested fix:
🚫 Important Rules
Do NOT rewrite the entire code
Do NOT jump to conclusions
Do NOT give generic advice
Focus on actionable feedback
Think like a production system reviewer
🧠 Mindset

Act like you are reviewing a high-scale production backend system.

Be strict, precise, and practical.
