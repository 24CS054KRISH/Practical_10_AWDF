# Web Development Practicals (SEM 5)

## 📌 Practical 4: Building a RESTful API with Node.js and Express
- Basic Express server setup on port `3000`.
- In-memory array task store.
- Custom logging middleware (`middleware/logger.js`).
- Modular route handlers using Express Router (`routes/taskRoutes.js`).
- Global error handling & 404 handler.

---

## 📌 Practical 5: MongoDB Integration and Schema Design with Mongoose
- Integrated **MongoDB Atlas** cloud database with `taskdb` database and `tasks` collection.
- Defined Mongoose schema and model (`models/Task.js`) with required `title`, defaults, and timestamps.
- Refactored all CRUD operations to asynchronous Mongoose methods (`Task.find()`, `task.save()`, `Task.findByIdAndUpdate()` with `runValidators: true`, `Task.findByIdAndDelete()`).
- Added structured error handling for `ValidationError` and `CastError` (`400 Bad Request`).

---

## 📌 Practical 6: Connecting React Frontend to Express + MongoDB Backend
- Connected a **React (Vite)** frontend to the **Express + MongoDB Atlas** backend using the native browser **Fetch API** and **CORS**.
- State-managed CRUD operations with real-time feedback.

---

## 🚀 PRACTICAL 7: Authentication and Middleware Pipeline

### 🎯 Objective
To implement **JWT-based authentication** and **input validation** as part of the Express middleware pipeline.

### 🏛️ Architecture & Middleware Pipeline Flow
```
POST /register  ──>  Hash password (bcrypt, 10 salt rounds)  ──>  Save User  ──>  201 Created (+ JWT)
POST /login     ──>  Verify password (bcrypt.compare)       ──>  Sign JWT   ──>  200 OK (Token: Bearer)

Protected Routes Flow (/tasks, /me):
Client Request [Authorization: Bearer <token>]
       │
       ▼
 [Auth Middleware]          ──> Extracts Bearer token, verifies via jwt.verify(), attaches req.user
       │                        (Returns 401 Unauthorized if missing, invalid, or expired)
       ▼
 [Validation Middleware]    ──> Validates payload (title required, non-empty string, boolean check)
       │                        (Returns 400 Bad Request if validation fails, rejecting before DB)
       ▼
 Controller (Task Routes)   ──> Executes DB operation scoped to req.user.id
```

### 📂 Practical 7 Project Structure
```
TaskManagerAPI/                     # Backend (Port 5000)
├── middleware/
│   ├── auth.js                     # JWT verification & req.user attachment (401 handler)
│   ├── validateTask.js             # Server-side input validation middleware (400 handler)
│   ├── logger.js                   # Request logging middleware
│   └── errorHandler.js             # Global central error handling
├── models/
│   ├── User.js                     # User schema (email, bcrypt password, timestamps)
│   └── Task.js                     # Task schema (title, desc, completed, user ref)
├── routes/
│   ├── authRoutes.js               # /register, /login, and /me endpoints
│   └── taskRoutes.js               # Protected CRUD task routes with validation pipeline
├── test-api.js                     # Automated verification test suite (15/15 tests)
├── .env                            # Excluded from git via .gitignore
├── .env.example                    # Template with PORT, MONGODB_URI, and JWT_SECRET
├── .gitignore                      # Strictly ignores .env, node_modules
├── app.js                          # Express app configuration & middleware mounts
├── package.json
└── package-lock.json

task-manager-frontend/              # Frontend (Port 5173 - React + Vite)
├── src/
│   ├── App.jsx                     # Minimal Subtle UI: Auth tabs, Tasks, /me, 401 interceptor
│   ├── App.css                     # Minimalist Subtle Styling (neutral palette, clean borders)
│   ├── index.css                   # Global reset
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## ⚙️ How to Run Both Applications

### 1. Terminal 1: Start Backend (Port 5000)
```bash
cd TaskManagerAPI
npm install
npm start
```
*Output: `Server running at http://localhost:5000` & `MongoDB connected successfully`*

To run automated backend validation tests:
```bash
node test-api.js
```
*(All 15 assertions: auth rejection, register, duplicate check, password strength, login, /me, validation middleware, task CRUD)*

### 2. Terminal 2: Start Frontend (Port 5173)
```bash
cd task-manager-frontend
npm install
npm run dev
```
*Access the app at: `http://localhost:5173`*

---

## 🔑 Endpoints Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` (or `/register`) | Public | Register user, bcrypt hash password, return 201 + JWT |
| `POST` | `/auth/login` (or `/login`) | Public | Verify password with bcrypt.compare, return 200 + JWT |
| `GET` | `/auth/me` (or `/me`) | Private (`Bearer <token>`) | Returns logged-in user details excluding password |
| `GET` | `/tasks` | Private (`Bearer <token>`) | Get all tasks for authenticated user |
| `POST` | `/tasks` | Private (`Bearer <token>`) | Create task (validated by input middleware) |
| `PUT` | `/tasks/:id` | Private (`Bearer <token>`) | Update task completion or title/desc |
| `DELETE`| `/tasks/:id` | Private (`Bearer <token>`) | Delete task |

---

## 🧪 Postman Testing Flow
1. **Register**: `POST http://localhost:5000/auth/register`
   - Body (JSON): `{"email": "samarth@test.com", "password": "password123"}`
   - Expected: `201 Created` with signed token.
2. **Login**: `POST http://localhost:5000/auth/login`
   - Body (JSON): `{"email": "samarth@test.com", "password": "password123"}`
   - Expected: `200 OK` with token. Copy the token.
3. **Get User Profile**: `GET http://localhost:5000/auth/me`
   - Header: `Authorization: Bearer <token>`
   - Expected: `200 OK` with user details (no password).
4. **Access Protected Tasks**: `GET http://localhost:5000/tasks`
   - Header: `Authorization: Bearer <token>`
   - Expected: `200 OK` with task array.
5. **Test Input Validation Middleware**: `POST http://localhost:5000/tasks`
   - Header: `Authorization: Bearer <token>`
   - Body: `{"title": ""}`
   - Expected: `400 Bad Request` with message: `"Validation error: Task title is required and cannot be empty"`.

---

## 💡 Key Viva & Analysis Questions

### 1. Why must passwords be hashed before storage instead of saved as plain text, even in a lab/demo project?
Plain-text passwords expose users to severe risk if a database leak, insider breach, or log dump occurs. Users frequently reuse passwords across services; leaking one plain-text password can compromise accounts everywhere. `bcrypt` adds a cryptographic salt and computationally intensive key stretching (work factor) to thwart rainbow tables and brute-force GPU attacks.

### 2. What does the authentication middleware actually verify, and what happens if the token is missing or expired?
The authentication middleware:
1. Inspects the `Authorization` header for the `Bearer <token>` format.
2. Verifies the cryptographic signature against `process.env.JWT_SECRET`.
3. Verifies token payload expiration (`exp`).
- If missing or malformed: returns `401 Unauthorized` (`Access denied. No token provided`).
- If expired or tampered: `jwt.verify()` throws `TokenExpiredError` or `JsonWebTokenError`, safely caught by `try/catch` to return `401 Unauthorized` without crashing the Express server.

### 3. Why should input validation happen on the server even if the frontend already validates the same fields?
Client-side validation is solely for user experience (immediate feedback). Any user or attacker can bypass frontend validation entirely using Postman, cURL, or browser dev tools. Server-side validation guarantees data integrity, prevents malformed database entries, and guards against injection and denial-of-service payloads before they reach the database layer.

---

## ⚡ PRACTICAL 9: In-Memory Caching and Query Optimization

### 🎯 Objective & Course Outcomes
- **Objective:** To implement server-side in-memory caching using `node-cache`, design strict write invalidation hooks, and empirically measure its performance impact on API response latency.
- **Course Outcomes:** CO2, CO4 / PO3, PO5
- **Reference:** Week 9 IBM: Node.js & MongoDB Developing Back-end Database Applications, Module 5 (optimization techniques, back-end performance, scaling approaches, load balancing).

---

### 🏛️ Architecture & Caching Workflow

```
GET /tasks Request
       │
       ▼
  Cache Check (`node-cache`)
   ├── HIT  ──> Return cached data immediately from RAM (< 2 ms)
   │            (Headers: X-Cache: HIT, X-Response-Time)
   └── MISS ──> Query MongoDB Atlas (~70-100 ms) ──> Store in cache (TTL: 60s) ──> Return data
                (Headers: X-Cache: MISS, X-Response-Time)

POST / PUT / DELETE /tasks (Write Operations)
       │
       ▼
 Write to MongoDB Atlas ──> On Success: Invalidate Cache Keys
                            ├── cache.del('all_tasks')
                            ├── cache.del('tasks_<userId>')
                            └── cache.del('task_<taskId>')  (for single task PUT/DELETE)
```

---

### 📂 Practical 9 Project Structure
```
TaskManagerAPI/                     # Backend (Port 5000)
├── cache.js                        # Shared node-cache instance (stdTTL: 60s, analytics & counters)
├── middleware/
│   ├── auth.js                     # JWT verification & req.user attachment
│   ├── validateTask.js             # Server-side input validation middleware
│   ├── logger.js                   # Request logging middleware
│   └── errorHandler.js             # Global central error handling
├── models/
│   ├── User.js                     # User schema (bcrypt password hashing)
│   └── Task.js                     # Task schema
├── routes/
│   ├── authRoutes.js               # /register, /login, and /me endpoints
│   └── taskRoutes.js               # Protected CRUD tasks + node-cache caching + write invalidation
├── capture-screenshots.js          # Puppeteer automation capturing high-res report screenshots
├── test-caching.js                 # Automated caching verification & latency benchmark suite (15/15 PASS)
├── test-api.js                     # Practical 7 authentication test suite (15/15 PASS)
├── .env                            # Excluded via .gitignore (PORT, MONGODB_URI, JWT_SECRET)
├── app.js                          # Express app configuration & public /cache/stats debug endpoint
├── package.json
└── package-lock.json

task-manager-frontend/              # Frontend (Port 5173 - React + Vite)
├── src/
│   ├── App.jsx                     # Minimal & Subtle UI with real-time Cache Monitor & Benchmark runner
│   ├── App.css                     # Subtle neutral design, crisp typography, micro-badges, clean tables
│   ├── index.css                   # Global reset
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

### 🔬 Empirical Latency Measurement (Postman / Test Runner Benchmark)

As required by **Lab Steps 5, 6, and 7**, three distinct sample readings were recorded for both cached and uncached requests:

| Sample Run | Uncached (MongoDB Atlas Direct) | Cached (`node-cache` In-Memory) | Latency Difference | Performance Gain |
| :---: | :---: | :---: | :---: | :---: |
| **Run 1** | `87.63 ms` (Server: 84.12 ms) | `6.70 ms` (Server: 1.38 ms) | `-80.93 ms` | **92.4% faster** |
| **Run 2** | `27.25 ms` (Server: 21.49 ms) | `13.53 ms` (Server: 0.61 ms) | `-13.72 ms` | **50.3% faster** |
| **Run 3** | `86.33 ms` (Server: 76.78 ms) | `2.08 ms` (Server: 0.66 ms) | `-84.25 ms` | **97.6% faster** |
| **Average** | **67.07 ms** | **7.44 ms** (Server: 0.88 ms) | **-59.63 ms** | **88.9% Average Speedup** |

> **Key Takeaway:** Serving cached JSON directly from V8 heap memory eliminates network round-trip overhead and BSON serialization from MongoDB Atlas, lowering API response times by **88.9%**.

---

### 🌟 Supplementary Problems Implemented

1. **Dedicated Single-Task Caching (`GET /tasks/:id`)**:
   - Each individual task lookup is cached separately under key `task_${req.params.id}` with standard TTL.
   - Initial lookup triggers a `Cache MISS`; subsequent lookups return in `< 2 ms` as a `Cache HIT`.
   - On `PUT /tasks/:id` or `DELETE /tasks/:id`, the specific single-task key is evicted alongside collection keys.

2. **Cache-Hit / Cache-Miss Debug Endpoint (`GET /cache/stats` & `GET /tasks/cache/stats`)**:
   - Exposes real-time hit and miss counters, calculated hit ratio, active key count, active key names, and standard TTL.
   - Supports cache flush via `POST /cache/clear`.

3. **Configurable TTL Experimentation (`POST /tasks/cache/ttl`)**:
   - Exposes dynamic TTL configuration to test and document cache eviction dynamics under varying TTL lengths (e.g. 5s, 30s, 60s, 300s).

---

### 💡 Key Viva & Analysis Questions

#### 1. Why must the cache be invalidated on every write operation, and what would happen to data correctness if it were not?
- **Why Invalidation is Mandatory:** In-memory caching stores a snapshot of database query results in RAM. When a mutation occurs (`POST` to create, `PUT` to edit, `DELETE` to remove), the state in the database changes immediately. If the cache is not invalidated, subsequent `GET` requests will continue serving the stale, outdated snapshot until the TTL naturally expires.
- **Consequences to Data Correctness:**
  - A user who adds a task would not see it appear in their task list (ghosting).
  - A user who marks a task as completed or edits its text would still observe the old status.
  - A user who deletes a task would still see the deleted task, creating severe data inconsistency and broken user experience.

#### 2. What is a reasonable TTL (time-to-live) for cached data in a task management context, and what trade-off does TTL length represent?
- **Reasonable TTL in Task Management:** Between **30 seconds and 120 seconds** (e.g., 60 seconds). Because tasks are actively manipulated by users but also frequently viewed, a 60-second window provides an optimal balance. Write-invalidation handles active mutations, while the 60s TTL bounds staleness if third-party writes occur.
- **The Core Trade-off:**
  - **Short TTL (e.g., 5s):** Guarantees high data freshness, but yields low cache hit ratios and frequent database roundtrips, reducing the performance benefit.
  - **Long TTL (e.g., 10m - 1h):** Delivers maximum database offloading and ultra-fast sub-millisecond responses, but risks prolonged data staleness if invalidation fails or if background processes update the database out-of-band.

#### 3. Why is in-memory caching (`node-cache`) not suitable for a multi-server/multi-instance deployment, even though it works fine in this lab?
- **Process Isolation:** `node-cache` stores cached objects directly in the V8 process heap of a single Node.js instance.
- **Split-Brain / Cache Inconsistency in Clusters:** If the backend is horizontally scaled across 3 server instances (Instance A, B, and C) behind a load balancer:
  1. A `GET /tasks` request hits Instance A, caching the tasks in Instance A's memory.
  2. A subsequent `POST /tasks` request hits Instance B, which writes to MongoDB and evicts cache on Instance B.
  3. Instance A never knows that a write occurred! Its memory still holds the old data.
  4. Subsequent requests routed to Instance A receive stale data, while requests routed to Instance B or C receive fresh data.
- **Production Solution:** Distributed in-memory caching using **Redis** or **Memcached**, where all server instances connect to a centralized, shared cache store with pub/sub invalidation channels.

---

### ⚙️ How to Run & Verify

1. **Start Backend (Port 5000):**
   ```bash
   cd TaskManagerAPI
   npm install
   npm start
   ```

2. **Start Frontend (Port 5173 - Minimal & Subtle UI):**
   ```bash
   cd task-manager-frontend
   npm install
   npm run dev
   ```

3. **Run Automated Test Suite:**
   ```bash
   cd TaskManagerAPI
   node test-caching.js
   ```
   *Expected output: All 15 assertions pass with empirical latency benchmarks.*
