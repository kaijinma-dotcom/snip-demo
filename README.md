# snip-demo

A minimal URL-shortener built as three independent layers, each living on its own
orphan branch and composed here as a Git submodule.

---

## The idea

```
Browser / CLI  ──→  Angular 19 SPA  ──→  Node.js API  ──→  in-memory store
                    (frontend branch)    (backend branch)
       └─────────────────────────────────────────────────→  (cli branch)
```

One backend, two clients:

| Client      | Branch     | How it works                                          |
|-------------|------------|-------------------------------------------------------|
| Angular SPA | `frontend` | Served statically; calls the API over HTTP            |
| Node CLI    | `cli`      | Invoked from the terminal; calls the same API         |

---

## API contract

Base URL: `http://localhost:3000` (override with `PORT` / `BASE_URL` env vars)

| Method | Path          | Body / Params        | Success                                              | Error              |
|--------|---------------|----------------------|------------------------------------------------------|--------------------|
| POST   | `/api/links`  | `{ url: string }`    | `201 { code, url, shortUrl, hits, createdAt }`       | `400 { error }`    |
| GET    | `/api/links`  | —                    | `200 [ ...link objects ]`                            | —                  |
| GET    | `/:code`      | `code` path segment  | `302 Location: <original url>`                       | `404 { error }`    |

---

## Repository layout

```
snip-demo/           ← superproject  (main branch)
├── backend/         ← submodule     (backend branch)  server.js + package.json
├── frontend/        ← submodule     (frontend branch) Angular 19 app
└── cli/             ← submodule     (cli branch)      cli.js + wrappers
```

Each submodule is a fully independent orphan branch of **this same repository**.
The superproject stores a pinned commit SHA for each submodule and a
`.gitmodules` file that records the branch each one tracks.

---

## Cloning

A plain `git clone` leaves the submodule folders empty. Always use:

```sh
git clone --branch main --recurse-submodules https://github.com/kaijinma-dotcom/snip-demo.git
```

> **Note:** `main` is the superproject branch. The repo's GitHub default branch is
> `frontend` (it was pushed first), so `--branch main` is required to land on the
> correct branch.

If you already cloned without `--recurse-submodules`:

```sh
git submodule update --init --recursive
```

---

## Running all three pieces

### 1 — Backend

```sh
cd backend
node server.js          # default: http://localhost:3000
# or
PORT=3000 node server.js
```

### 2 — Angular SPA (dev server)

```sh
cd frontend
npm install
npx ng serve            # http://localhost:4200
```

The app talks directly to `http://localhost:3000`; no proxy needed in development.

Production build:

```sh
npx ng build            # output → dist/snip-frontend/browser
```

### 3 — CLI

```sh
cd cli
node cli.js help

# or install globally
npm install -g .
snip help
```

Override the API base URL:

```sh
SNIP_API=https://your-api.example.com snip ls
```

---

## Updating a submodule

Work inside the submodule folder exactly like a normal repo:

```sh
cd backend          # (or frontend / cli)
# ... edit files ...
git add -A
git commit -m "fix: ..."
git push            # pushes to the submodule's own branch on GitHub
cd ..               # back to the superproject
```

Then bump the superproject's pointer so collaborators get the new commit:

```sh
git submodule update --remote backend   # fetch latest commit on tracked branch
git add backend
git commit -m "chore: bump backend submodule"
git push
```

Other contributors update after pulling:

```sh
git pull
git submodule update --init --recursive
```
