# Tally

A small team task list: sign in, see the team's tasks, add one, change your settings.

## Run it

Requirements: Node 22 or later, PostgreSQL 14 or later.

```bash
cp .env.example .env      # then point DATABASE_URL at your database
npm install
npm run db:migrate
npm run db:seed           # demo team, tasks and the demo user
npm start                 # http://localhost:3000
```

Sign in as `demo@tally.dev` with the password `demo1234`.

## API

### `GET /api/tasks`

Returns every task of the team as JSON.

It needs a signed-in session: the `session` cookie that signing in sets. Without
a valid one, the API does not answer with JSON: it redirects to `/login`
(`302 Found`).

```bash
# Sign in once and keep the session cookie
curl -s -o /dev/null -c cookies.txt -d 'email=demo@tally.dev&password=demo1234' http://localhost:3000/login
# Then call the API with it
curl -s -b cookies.txt http://localhost:3000/api/tasks
```

The response is an object with one field, `tasks`: a list ordered by status
(doing, then to do, then done), then by due date (tasks without one last).
Each task has:

| Field      | Type           | Meaning                                                     |
| ---------- | -------------- | ----------------------------------------------------------- |
| `id`       | number         | The task's id.                                              |
| `title`    | string         | What the task is, as typed when it was added.               |
| `status`   | string         | `"todo"`, `"doing"` or `"done"`.                            |
| `assignee` | string or null | The name of the person it is assigned to, `null` if nobody. |

Example response with the demo data, shortened to four tasks:

```json
{
  "tasks": [
    {
      "id": 2,
      "title": "Fix the export to CSV",
      "status": "doing",
      "assignee": "Léa Martin"
    },
    {
      "id": 4,
      "title": "Answer the pricing question from Acme",
      "status": "todo",
      "assignee": "Demo User"
    },
    {
      "id": 5,
      "title": "Update the team page",
      "status": "todo",
      "assignee": null
    },
    {
      "id": 7,
      "title": "Renew the domain",
      "status": "done",
      "assignee": "Sam Okafor"
    }
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
- `src/auth.js`: passwords and the signed session cookie.
- `src/db.js`: queries.
- `db/schema.sql`: tables. `scripts/seed.js`: demo data.
- `public/style.css`: styles.
