# Tally

A small team task list: sign in, see the team's tasks and their comments, add one, change your settings, get your open tasks by email every Monday.

## Run it

Requirements: Node 22 or later, PostgreSQL 14 or later.

```bash
cp .env.example .env      # then point DATABASE_URL at your database
npm install
npm run db:migrate        # applies db/migrations/*.sql, each once
npm run db:seed           # demo team, tasks, comments and the demo user
npm start                 # http://localhost:3000
```

Sign in as `demo@tally.dev` with the password `demo1234`.

`npm run db:seed -- --many` adds a big team's backlog (3,000 tasks).

## The weekly digest

```bash
MAIL_TRANSPORT=file npm run digest   # writes each email to outbox/
```

Production runs it every Monday at 8:00 with `MAIL_TRANSPORT=smtp`.

## API

### `GET /api/tasks`

Every task of the team, as JSON.

It needs a signed-in session: the `session` cookie set by signing in at `/login`. Without it, the request is redirected to `/login` (`302`), not answered with JSON.

```bash
curl -c cookies.txt -d 'email=demo@tally.dev&password=demo1234' http://localhost:3000/login
curl -b cookies.txt http://localhost:3000/api/tasks
```

The response is an object with a `tasks` array. Each task has:

| Field      | Type           | Meaning                                                 |
| ---------- | -------------- | ------------------------------------------------------- |
| `id`       | number         | The task's id.                                          |
| `title`    | string         | The task's title.                                       |
| `status`   | string         | `"todo"`, `"doing"` or `"done"`.                        |
| `assignee` | string or null | The assignee's name, or `null` when nobody is assigned. |

Tasks come in progress first, then to do, then done; within each, by due date (tasks without one last), then by id.

Example response:

```json
{
  "tasks": [
    { "id": 2, "title": "Fix the export to CSV", "status": "doing", "assignee": "Léa Martin" },
    { "id": 5, "title": "Update the team page", "status": "todo", "assignee": null },
    { "id": 8, "title": "Ship the new login page", "status": "done", "assignee": "Demo User" }
  ]
}
```

## Test

```bash
npm test
```

## Layout

- `src/server.js`: routes (pages and `/api/tasks`).
- `src/views.js`: the HTML of each page.
- `src/digest.js`: the weekly digest email. `src/mail.js`: sending it.
- `src/auth.js`: passwords and the signed session cookie.
- `src/db.js`: queries.
- `db/migrations/`: the schema, one file per change. `scripts/seed.js`: demo data.
- `public/style.css`: styles.
