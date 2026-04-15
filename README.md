## Alumni Connect

### Backend (Express + MongoDB)

- **Setup**
  - Copy `.env.example` to `.env` and fill values
  - Install deps and run:

```bash
npm install
npm run dev
```

- **Health**
  - `GET /health`

### API (v1)

- **Auth**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout` (auth)
  - `GET /api/v1/auth/me` (auth)
  - `POST /api/v1/auth/refresh-token`

- **Users** (auth)
  - `GET /api/v1/users/me`
  - `PATCH /api/v1/users/me`
  - `GET /api/v1/users`
  - `GET /api/v1/users/:id`

- **Posts** (auth)
  - `POST /api/v1/posts`
  - `GET /api/v1/posts`
  - `GET /api/v1/posts/:id`
  - `PATCH /api/v1/posts/:id` (owner/admin)
  - `DELETE /api/v1/posts/:id` (owner/admin)

- **Comments** (auth)
  - `GET /api/v1/comments/post/:postId`
  - `POST /api/v1/comments/post/:postId`
  - `DELETE /api/v1/comments/:id` (owner/admin)

- **Likes** (auth)
  - `GET /api/v1/likes/post/:postId`
  - `POST /api/v1/likes/post/:postId/toggle`

- **Connections** (auth)
  - `GET /api/v1/connections`
  - `GET /api/v1/connections/incoming`
  - `GET /api/v1/connections/outgoing`
  - `POST /api/v1/connections/send/:receiverId`
  - `POST /api/v1/connections/respond/:id` body: `{ "action": "accepted" | "rejected" }`
  - `DELETE /api/v1/connections/cancel/:id`

### Frontend (React)

This environment doesn’t have `npm`, so create the frontend locally:

```bash
cd /Users/suhasmudholkar/Documents/Alumni_Connect
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev
```

Then set Vite proxy (recommended) or call the backend directly at `http://localhost:8000`.

