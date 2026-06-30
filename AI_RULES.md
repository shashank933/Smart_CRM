# AI Rules — Smart CRM

## Tech Stack

- **Frontend:** React 18.3, React Router DOM 6.26, Zustand 4.5 (state), Recharts 2.12 (charts), Lucide React 0.441 (icons), date-fns 3.6 (dates), Vite 5.4 builder, vanilla CSS with claymorphism theming
- **Backend:** Node.js + Express 4.21 (API framework), tsx 4.19 runtime (no compile step), TypeScript 5.5
- **Auth:** JWT (jsonwebtoken 9.0) + bcryptjs 2.4 for passwords; API tokens with `crmsk_` prefix and per-resource permission scoping
- **Database:** sql.js 1.11 (SQLite compiled to WebAssembly — in-process, no external DB server), single file `server/data/crm.db`, custom `DBWrapper`/`StatementWrapper` classes for raw SQL queries
- **AI:** OpenAI Node SDK 4.67 for chat, deal/contact insights, email generation, summarization, and predictive scoring
- **Containerization:** Multi-stage Dockerfile (node:20-alpine), docker-compose with named volume for DB persistence

## Library Usage Rules

1. **State management must use Zustand.** Do NOT introduce Redux, Jotai, Recoil, Context API for global state, or any other state library. The single store lives at `client/src/store/store.js`.
2. **Database access must use the existing DBWrapper pattern.** Do NOT add Sequelize, Knex, Prisma, TypeORM, better-sqlite3, or any ORM/query builder. All queries are raw SQL via `db.prepare()`, `stmt.all()`, `stmt.get()`, `stmt.run()`. The DB wrapper is in `server/src/config/db.js`.
3. **Styling must use vanilla CSS.** Do NOT introduce Tailwind, Sass, CSS-in-JS, styled-components, or any CSS framework. The existing theme system uses `data-theme` attributes on `<html>` and CSS custom properties defined in `themes.css`.
4. **Date handling must use date-fns.** Do NOT introduce moment, dayjs, luxon, or any other date library.
5. **Icons must use Lucide React.** Do NOT introduce Font Awesome, Material Icons, Heroicons, or any other icon library.
6. **Charts must use Recharts.** Do NOT introduce Chart.js, D3, ApexCharts, Nivo, or any other charting library.
7. **Routing must use React Router DOM v6.** Do NOT introduce TanStack Router, Next.js App Router, or Reach Router.
8. **Auth must remain JWT + bcryptjs.** Do NOT change the auth mechanism to OAuth, Passport.js, NextAuth, sessions, or any other scheme. Tokens are sent as `Authorization: Bearer <token>` and stored in `localStorage` under key `token`.
9. **Server runtime is tsx.** Do NOT introduce a compile/build step for the server (no tsc emit, no esbuild, no ts-node). The server runs directly from `.ts` files via `npx tsx`.
10. **Build tool is Vite for the client only.** Do NOT introduce webpack, esbuild, Rollup directly, or any other bundler for the client.
11. **Dependencies added to `package.json` must match the existing package manager (npm).** The project uses npm with `package-lock.json`. Do NOT add `yarn.lock`, `pnpm-lock.yaml`, or `bun.lock`.

## File Organization Rules

- Server route files go in `server/src/routes/` and mount under `/api/<name>`
- Middleware goes in `server/src/middleware/`
- Configuration goes in `server/src/config/`
- React components live in `client/src/components/`
- The Zustand store lives in `client/src/store/store.js`
- Server uses ESM (`"type": "module"` in package.json) — use `import`/`export` syntax, NEVER `require()`/`module.exports`
- Client can use `.jsx` or `.tsx` extensions; set `lang="ts"` in Vite `<script>` tags for TypeScript in `.jsx` files

## Code Style Rules

- No inline comments unless documenting a non-obvious bug fix or complex algorithm
- Follow existing patterns for error responses: `res.status(code).json({ error: 'message' })`
- Database queries should use parameterized statements via `stmt.bind()` or positional params
- Keep route handlers thin — business logic belongs in dedicated functions, not inline in route callbacks
