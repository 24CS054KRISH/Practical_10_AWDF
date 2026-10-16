import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000";

/* ── Minimal Subtle SVG Icons ── */
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconLogOut = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconBell = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconAlertCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

function App() {
  // Authentication state
  const [token, setToken] = useState(() => localStorage.getItem("tm_auth_token") || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Active view tab: "dashboard", "events", "benchmark", "analysis"
  const [activeTab, setActiveTab] = useState("dashboard");

  // Task list state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listenerDelay, setListenerDelay] = useState(2000);
  const [simulateErrorInCreate, setSimulateErrorInCreate] = useState(false);

  // Notification and live banner state
  const [notice, setNotice] = useState(null);

  // Background Event Stream state
  const [eventLogs, setEventLogs] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [autoPollEvents, setAutoPollEvents] = useState(true);

  // Benchmark comparison state
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);

  const noticeTimeoutRef = useRef(null);

  const showNotice = (text, type = "info") => {
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    setNotice({ text, type, timestamp: new Date().toLocaleTimeString() });
    noticeTimeoutRef.current = setTimeout(() => setNotice(null), 5000);
  };

  // Helper: Authenticated fetch
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
      });

      if (res.status === 401) {
        localStorage.removeItem("tm_auth_token");
        setToken("");
        setUser(null);
        showNotice("Session expired or unauthorized. Please log in.", "error");
        throw new Error("401 Unauthorized");
      }
      return res;
    },
    [token]
  );

  // Fetch /auth/me
  const fetchCurrentUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authFetch("/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.warn("Failed to fetch user profile:", err.message);
    }
  }, [token, authFetch]);

  // Fetch task list
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await authFetch("/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      }
    } catch (err) {
      if (!err.message.includes("401")) showNotice(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token, authFetch]);

  // Fetch Event Audit Logs
  const fetchEventLogs = useCallback(async () => {
    try {
      setEventsLoading(true);
      const res = await fetch(`${API_BASE}/events/logs`);
      if (res.ok) {
        const data = await res.json();
        setEventLogs(data.logs || []);
      }
    } catch (err) {
      console.warn("Failed to fetch event logs:", err.message);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // Clear Event Audit Logs
  const handleClearEventLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/events/clear`, { method: "POST" });
      if (res.ok) {
        setEventLogs([]);
        showNotice("Event audit buffer cleared.", "info");
      }
    } catch (err) {
      showNotice("Failed to clear event logs", "error");
    }
  };

  // Trigger error simulation
  const handleTriggerErrorSimulation = async () => {
    try {
      showNotice("Emitting error event into pipeline...", "info");
      const res = await fetch(`${API_BASE}/events/simulate-error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Simulated SMTP Failure",
          user: user ? user.name : "TestUser",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotice("Simulated error event emitted. Waiting for error listener...", "warning");
        setTimeout(fetchEventLogs, 2200);
      }
    } catch (err) {
      showNotice("Error triggering simulation", "error");
    }
  };

  // Initial load
  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      fetchTasks();
    }
    fetchEventLogs();
  }, [token, fetchCurrentUser, fetchTasks, fetchEventLogs]);

  // Auto-polling for event stream
  useEffect(() => {
    if (!autoPollEvents) return;
    const interval = setInterval(() => {
      fetchEventLogs();
    }, 2000);
    return () => clearInterval(interval);
  }, [autoPollEvents, fetchEventLogs]);

  // Auth Submit (Login / Register)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthSubmitting(true);
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        authMode === "login"
          ? { email: authEmail.trim(), password: authPassword }
          : { name: authName.trim(), email: authEmail.trim(), password: authPassword };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotice(data.message || "Authentication failed", "error");
        return;
      }

      localStorage.setItem("tm_auth_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setAuthPassword("");
      showNotice(
        authMode === "login" ? `Welcome back, ${data.user.name}` : "Account created successfully!",
        "success"
      );
    } catch (err) {
      showNotice(err.message, "error");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("tm_auth_token");
    setToken("");
    setUser(null);
    setTasks([]);
    showNotice("Signed out successfully.", "info");
  };

  // Task Creation (Demonstrates Step 3: Immediate response + Background listener)
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showNotice("Task title cannot be empty", "error");
      return;
    }

    try {
      setLoading(true);
      const reqStart = performance.now();
      const res = await authFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          completed: false,
          customDelay: listenerDelay,
          simulateError: simulateErrorInCreate,
        }),
      });

      const reqEnd = performance.now();
      const roundTripMs = Math.round(reqEnd - reqStart);
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.message || "Failed to create task", "error");
        return;
      }

      setTasks((prev) => [data.task, ...prev]);
      setTitle("");
      setDescription("");

      showNotice(
        `⚡ Instant Response (${roundTripMs}ms): Task created! Background listener running with ${listenerDelay}ms delay...`,
        "success"
      );

      // Refresh event logs immediately to see API timestamp and then after listener completes
      fetchEventLogs();
      setTimeout(fetchEventLogs, listenerDelay + 250);
    } catch (err) {
      if (!err.message.includes("401")) showNotice(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Task Deletion (Demonstrates Supplementary Problem 1: task-deleted event)
  const handleDeleteTask = async (taskId) => {
    try {
      const reqStart = performance.now();
      const res = await authFetch(`/tasks/${taskId}`, { method: "DELETE" });
      const reqEnd = performance.now();
      const roundTripMs = Math.round(reqEnd - reqStart);

      if (!res.ok) {
        const data = await res.json();
        showNotice(data.message || "Failed to delete task", "error");
        return;
      }

      setTasks((prev) => prev.filter((t) => t._id !== taskId && t.id !== taskId));
      showNotice(`🗑️ Deleted instantly in ${roundTripMs}ms! Background task-deleted cleanup dispatched.`, "info");

      fetchEventLogs();
      setTimeout(fetchEventLogs, 1750);
    } catch (err) {
      if (!err.message.includes("401")) showNotice(err.message, "error");
    }
  };

  // Run Non-Blocking Benchmark Test
  const handleRunBenchmark = async () => {
    if (!token) {
      showNotice("Please sign in to run the benchmark", "warning");
      return;
    }
    setBenchmarking(true);
    setBenchmarkResult(null);

    try {
      const benchmarkDelay = 2000;
      const tStart = performance.now();
      const res = await authFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: `Non-Blocking Benchmark Test [${new Date().toLocaleTimeString()}]`,
          description: "Measuring empirical decoupling between API response and listener finish.",
          customDelay: benchmarkDelay,
        }),
      });
      const tEnd = performance.now();
      const apiDurationMs = Math.round(tEnd - tStart);
      const data = await res.json();

      const createdId = data.task ? (data.task._id || data.task.id) : null;
      setTasks((prev) => [data.task, ...prev]);

      const initialResult = {
        taskId: createdId,
        title: data.task.title,
        apiDurationMs: apiDurationMs,
        simulatedDelayMs: benchmarkDelay,
        apiTimestamp: data.apiResponseTimestamp,
        listenerCompletedAt: null,
        status: "waiting_listener",
      };
      setBenchmarkResult(initialResult);

      showNotice(`API responded in ${apiDurationMs}ms! Background worker executing in event loop...`, "info");

      // Poll event logs after 2200ms to extract completed listener timing
      setTimeout(async () => {
        const logRes = await fetch(`${API_BASE}/events/logs`);
        if (logRes.ok) {
          const logData = await logRes.json();
          const found = (logData.logs || []).find(
            (l) => l.taskId === createdId && l.event === "task-created"
          );
          if (found) {
            const apiTime = new Date(found.apiResponseTimestamp).getTime();
            const doneTime = new Date(found.listenerCompletedAt).getTime();
            const realDeltaMs = doneTime - apiTime;

            setBenchmarkResult({
              ...initialResult,
              listenerReceivedAt: found.listenerReceivedAt,
              listenerCompletedAt: found.listenerCompletedAt,
              realDeltaMs: realDeltaMs,
              status: "completed",
            });
            showNotice(`✓ Listener finished! Proved ${realDeltaMs}ms decoupled from API response.`, "success");
            fetchEventLogs();
          }
        }
        setBenchmarking(false);
      }, benchmarkDelay + 300);
    } catch (err) {
      showNotice(err.message, "error");
      setBenchmarking(false);
    }
  };

  // Compute metrics from current event logs
  const totalEvents = eventLogs.length;
  const createdEvents = eventLogs.filter((e) => e.event === "task-created").length;
  const deletedEvents = eventLogs.filter((e) => e.event === "task-deleted").length;
  const errorEvents = eventLogs.filter((e) => e.event === "error").length;

  return (
    <div className="app-shell">
      {/* ── Top Header Bar ── */}
      <header className="header">
        <div className="header-brand">
          <div className="brand-badge">P10</div>
          <div className="brand-text">
            <div className="brand-title">TaskFlow Architecture</div>
            <div className="brand-subtitle">Node.js EventEmitter Asynchronous Pipeline</div>
          </div>
        </div>

        <div className="header-nav">
          <button
            className={`nav-tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            Tasks & Workflow
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            Async Event Stream
            {eventLogs.length > 0 && <span className="tab-pill">{eventLogs.length}</span>}
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "benchmark" ? "active" : ""}`}
            onClick={() => setActiveTab("benchmark")}
          >
            Stopwatch Benchmark
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "analysis" ? "active" : ""}`}
            onClick={() => setActiveTab("analysis")}
          >
            Viva & Theory
          </button>
        </div>

        <div className="header-actions">
          {user ? (
            <div className="user-profile">
              <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">24CS034 • CSPIT</span>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Sign Out">
                <IconLogOut />
              </button>
            </div>
          ) : (
            <div className="guest-indicator">Student Evaluation Mode</div>
          )}
        </div>
      </header>

      {/* ── Subtle Notification Bar ── */}
      {notice && (
        <div className={`notification-bar ${notice.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notice.type === "success" && <IconCheck />}
              {notice.type === "error" && <IconAlertCircle />}
              {notice.type === "warning" && <IconZap />}
              {notice.type === "info" && <IconBell />}
            </span>
            <span className="notification-text">{notice.text}</span>
          </div>
          <span className="notification-time">{notice.timestamp}</span>
        </div>
      )}

      {/* ── Main Workspace ── */}
      <main className="main-container">
        {/* ── Unauthenticated Welcome / Login State ── */}
        {!token ? (
          <div className="auth-card-wrap">
            <div className="auth-card">
              <div className="auth-header">
                <div className="auth-badge">Authentication Pipeline</div>
                <h2 className="auth-title">Task Management Portal</h2>
                <p className="auth-subtitle">
                  Practical 10: Asynchronous Processing with Event-Driven Architecture (CO4 / PO3, PO5)
                </p>
              </div>

              <div className="auth-tabs">
                <button
                  className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                  onClick={() => setAuthMode("login")}
                >
                  Sign In
                </button>
                <button
                  className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                  onClick={() => setAuthMode("register")}
                >
                  Register Student Account
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="auth-form">
                {authMode === "register" && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      id="reg-name"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Samarth Kalavadia"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    id="auth-email"
                    type="email"
                    className="form-input"
                    placeholder="student@charusat.edu.in"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    className="form-input"
                    placeholder="••••••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={authSubmitting}>
                  {authSubmitting
                    ? "Authenticating..."
                    : authMode === "login"
                    ? "Authenticate & Access API"
                    : "Create Account & Start Session"}
                </button>
              </form>

              <div className="auth-footer-notes">
                <span>✓ Node.js Native EventEmitter</span>
                <span>✓ Non-Blocking Request Path</span>
                <span>✓ Decoupled Async Handlers</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── TAB 1: Tasks & Workflow ── */}
            {activeTab === "dashboard" && (
              <div className="content-grid">
                {/* Left Panel: Task Creation Form */}
                <div className="panel left-panel">
                  <div className="panel-header">
                    <h3 className="panel-title">Create Task & Emit Event</h3>
                    <span className="panel-tag">POST /tasks</span>
                  </div>

                  <form onSubmit={handleCreateTask} className="task-form">
                    <div className="form-group">
                      <label className="form-label">Task Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Synchronize event queue buffers"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description (Optional)</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Context or task payload details..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                      />
                    </div>

                    {/* Step 5: Artificial Delay Controller */}
                    <div className="form-group">
                      <div className="delay-label-row">
                        <label className="form-label">Simulated Listener Delay (Step 5)</label>
                        <span className="delay-value-badge">{listenerDelay} ms</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="5000"
                        step="500"
                        value={listenerDelay}
                        onChange={(e) => setListenerDelay(Number(e.target.value))}
                        className="delay-slider"
                      />
                      <div className="delay-hints">
                        <span>500ms (Quick)</span>
                        <span className="delay-recommended">2000ms (PDF Spec)</span>
                        <span>5000ms (Heavy I/O)</span>
                      </div>
                    </div>

                    {/* Supplementary Problem 2: Error simulation toggle */}
                    <div className="form-checkbox-row">
                      <input
                        type="checkbox"
                        id="chk-sim-error"
                        checked={simulateErrorInCreate}
                        onChange={(e) => setSimulateErrorInCreate(e.target.checked)}
                      />
                      <label htmlFor="chk-sim-error" className="checkbox-label">
                        Simulate exception inside event handler (Tests error listener)
                      </label>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                      <IconPlus />
                      <span>{loading ? "Saving & Emitting..." : "Create Task (Immediate 201 Response)"}</span>
                    </button>
                  </form>

                  {/* Architecture Diagram Snippet matching PDF */}
                  <div className="diagram-box">
                    <div className="diagram-title">Decoupled Architecture Flow</div>
                    <div className="diagram-flow">
                      <div className="flow-step">1. POST /tasks request</div>
                      <div className="flow-arrow">↓</div>
                      <div className="flow-step">2. Save task to MongoDB</div>
                      <div className="flow-arrow">↓</div>
                      <div className="flow-split">
                        <div className="split-left">
                          <strong>emit('task-created')</strong>
                          <div className="sub-desc">Fires event & returns immediately</div>
                        </div>
                        <div className="split-arrow">──►</div>
                        <div className="split-right">
                          <span className="code-pill">API responds 201</span>
                          <div className="sub-desc">Latency: ~15ms</div>
                        </div>
                      </div>
                      <div className="flow-arrow">↓ (asynchronous, after response)</div>
                      <div className="flow-step listener-step">
                        <strong>Notification Listener</strong>
                        <div className="sub-desc">Logs task title, timestamp, assigned user</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Task List & Quick Live Actions */}
                <div className="panel right-panel">
                  <div className="panel-header">
                    <div className="panel-title-group">
                      <h3 className="panel-title">Active Tasks</h3>
                      <span className="count-chip">{tasks.length}</span>
                    </div>
                    <div className="panel-actions">
                      <button className="icon-btn" onClick={fetchTasks} title="Refresh Task List">
                        <IconRefresh />
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Test Buttons */}
                  <div className="quick-actions-bar">
                    <button className="quick-action-btn primary" onClick={handleRunBenchmark}>
                      <IconZap /> Run Non-Blocking Benchmark
                    </button>
                    <button className="quick-action-btn danger" onClick={handleTriggerErrorSimulation}>
                      <IconAlertCircle /> Test Error Event Listener
                    </button>
                  </div>

                  {/* Task Items */}
                  <div className="task-list">
                    {loading && tasks.length === 0 ? (
                      <div className="empty-state">Loading tasks from database...</div>
                    ) : tasks.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-title">No tasks found</div>
                        <p className="empty-subtitle">
                          Create your first task on the left to see the instant API response and decoupled background notification!
                        </p>
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <div key={task._id || task.id} className="task-card">
                          <div className="task-main">
                            <h4 className="task-title">{task.title}</h4>
                            {task.description && <p className="task-desc">{task.description}</p>}
                            <div className="task-meta">
                              <span className="meta-id">ID: {(task._id || task.id).slice(-6)}</span>
                              <span className="meta-date">
                                Created: {new Date(task.createdAt || Date.now()).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          <div className="task-actions">
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteTask(task._id || task.id)}
                              title="Delete Task & Emit 'task-deleted' Event"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: Async Event Stream & Audit Log ── */}
            {activeTab === "events" && (
              <div className="events-stream-view">
                {/* Stats Summary Bar */}
                <div className="stream-stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Total Emitted Events</span>
                    <span className="stat-number">{totalEvents}</span>
                    <span className="stat-sub">Buffered in-memory</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">'task-created' Events</span>
                    <span className="stat-number text-success">{createdEvents}</span>
                    <span className="stat-sub">Step 2 & 3 Handlers</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">'task-deleted' Events</span>
                    <span className="stat-number text-indigo">{deletedEvents}</span>
                    <span className="stat-sub">Supplementary Prob 1</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">'error' Events Caught</span>
                    <span className="stat-number text-danger">{errorEvents}</span>
                    <span className="stat-sub">Resilient Error Listener</span>
                  </div>
                </div>

                {/* Event Table Card */}
                <div className="stream-table-card">
                  <div className="stream-table-header">
                    <div>
                      <h3 className="panel-title">Real-Time EventEmitter Audit Stream</h3>
                      <p className="table-subtitle">
                        Demonstrating that the API responds before the listener finishes executing (timestamp proof).
                      </p>
                    </div>
                    <div className="stream-controls">
                      <label className="poll-toggle">
                        <input
                          type="checkbox"
                          checked={autoPollEvents}
                          onChange={(e) => setAutoPollEvents(e.target.checked)}
                        />
                        <span>Auto-refresh (2s)</span>
                      </label>
                      <button className="small-action-btn" onClick={fetchEventLogs} title="Refresh">
                        <IconRefresh /> Refresh
                      </button>
                      <button className="small-action-btn danger" onClick={handleClearEventLogs}>
                        Clear Buffer
                      </button>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table className="stream-table">
                      <thead>
                        <tr>
                          <th>Event Type</th>
                          <th>Task Title / ID</th>
                          <th>API Response Time (T₀)</th>
                          <th>Listener Received</th>
                          <th>Listener Completed</th>
                          <th>Decoupled Delta (Δt)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="table-empty">
                              No background events recorded yet. Create or delete a task to inspect live events.
                            </td>
                          </tr>
                        ) : (
                          eventLogs.map((log) => {
                            const apiTime = log.apiResponseTimestamp
                              ? new Date(log.apiResponseTimestamp).getTime()
                              : null;
                            const doneTime = log.listenerCompletedAt
                              ? new Date(log.listenerCompletedAt).getTime()
                              : null;
                            const deltaMs = apiTime && doneTime ? doneTime - apiTime : log.delayMs;

                            return (
                              <tr key={log.id}>
                                <td>
                                  <span
                                    className={`event-chip ${
                                      log.event === "task-created"
                                        ? "chip-created"
                                        : log.event === "task-deleted"
                                        ? "chip-deleted"
                                        : "chip-error"
                                    }`}
                                  >
                                    {log.event}
                                  </span>
                                </td>
                                <td className="task-col">
                                  <strong>{log.title}</strong>
                                  <div className="task-user-sub">User: {log.user}</div>
                                </td>
                                <td className="mono-time">
                                  {log.apiResponseTimestamp
                                    ? new Date(log.apiResponseTimestamp).toLocaleTimeString() +
                                      "." +
                                      new Date(log.apiResponseTimestamp).getMilliseconds()
                                    : "N/A"}
                                </td>
                                <td className="mono-time">
                                  {log.listenerReceivedAt
                                    ? new Date(log.listenerReceivedAt).toLocaleTimeString() +
                                      "." +
                                      new Date(log.listenerReceivedAt).getMilliseconds()
                                    : "N/A"}
                                </td>
                                <td className="mono-time">
                                  {log.listenerCompletedAt
                                    ? new Date(log.listenerCompletedAt).toLocaleTimeString() +
                                      "." +
                                      new Date(log.listenerCompletedAt).getMilliseconds()
                                    : "Processing..."}
                                </td>
                                <td>
                                  <span className="delta-badge">
                                    +{deltaMs !== null ? deltaMs : log.delayMs} ms
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`status-chip ${
                                      log.status === "completed" ? "chip-ok" : "chip-err"
                                    }`}
                                  >
                                    {log.status === "completed" ? "✓ Handled Non-Blocking" : "⚠️ Error Handled"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: Stopwatch Benchmark ── */}
            {activeTab === "benchmark" && (
              <div className="benchmark-view">
                <div className="benchmark-hero">
                  <div className="benchmark-hero-header">
                    <div>
                      <h3 className="hero-title">Empirical Non-Blocking Benchmark</h3>
                      <p className="hero-subtitle">
                        Validates Step 6: "Confirm and record that the API response timestamp appears before the listener's completion timestamp in the console."
                      </p>
                    </div>
                    <button
                      className="run-bench-btn"
                      onClick={handleRunBenchmark}
                      disabled={benchmarking}
                    >
                      <IconZap /> {benchmarking ? "Executing Benchmark..." : "Run Live Verification Benchmark"}
                    </button>
                  </div>

                  {benchmarkResult && (
                    <div className="benchmark-cards-grid">
                      <div className="metric-box green">
                        <div className="metric-title">API Response Roundtrip</div>
                        <div className="metric-val">{benchmarkResult.apiDurationMs} ms</div>
                        <div className="metric-sub">Immediate HTTP 201 Created</div>
                      </div>

                      <div className="metric-box amber">
                        <div className="metric-title">Simulated Worker Delay</div>
                        <div className="metric-val">{benchmarkResult.simulatedDelayMs} ms</div>
                        <div className="metric-sub">setTimeout background queue</div>
                      </div>

                      <div className="metric-box purple">
                        <div className="metric-title">Decoupling Delta (Δt)</div>
                        <div className="metric-val">
                          {benchmarkResult.realDeltaMs ? `${benchmarkResult.realDeltaMs} ms` : "Processing..."}
                        </div>
                        <div className="metric-sub">Time saved on critical path</div>
                      </div>
                    </div>
                  )}

                  {benchmarkResult && (
                    <div className="timeline-card">
                      <h4 className="timeline-title">Event-Loop Execution Timeline</h4>
                      <div className="timeline-steps">
                        <div className="timeline-node complete">
                          <div className="node-marker">1</div>
                          <div className="node-body">
                            <div className="node-head">HTTP POST /tasks Arrives</div>
                            <div className="node-desc">Mongoose saves document to MongoDB.</div>
                          </div>
                        </div>

                        <div className="timeline-node complete">
                          <div className="node-marker">2</div>
                          <div className="node-body">
                            <div className="node-head">
                              API Response Sent: <span className="mono-txt">{benchmarkResult.apiTimestamp}</span>
                            </div>
                            <div className="node-desc">
                              Client receives 201 Created in <strong>{benchmarkResult.apiDurationMs}ms</strong>.
                            </div>
                          </div>
                        </div>

                        <div className="timeline-node complete">
                          <div className="node-marker">3</div>
                          <div className="node-body">
                            <div className="node-head">taskEvents.emit('task-created', task)</div>
                            <div className="node-desc">
                              Synchronous listener receives event, registers background timer, and immediately returns.
                            </div>
                          </div>
                        </div>

                        <div className={`timeline-node ${benchmarkResult.status === "completed" ? "complete" : "running"}`}>
                          <div className="node-marker">4</div>
                          <div className="node-body">
                            <div className="node-head">
                              Notification Listener Completes:{" "}
                              <span className="mono-txt">
                                {benchmarkResult.listenerCompletedAt || "Waiting for timer expiration..."}
                              </span>
                            </div>
                            <div className="node-desc">
                              Executed in Node.js Timers phase without blocking subsequent requests.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: Viva, Architecture & Analysis ── */}
            {activeTab === "analysis" && (
              <div className="analysis-view">
                <div className="analysis-card">
                  <div className="analysis-card-header">
                    <span className="section-pill">Conceptual Understanding</span>
                    <h3 className="analysis-title">Answers to Key Questions & Viva Analysis</h3>
                  </div>

                  <div className="qa-list">
                    {/* Q1 */}
                    <div className="qa-item">
                      <div className="qa-question">
                        Q1. Why does emitting an event not block the API response, even though both run on the same Node.js process?
                      </div>
                      <div className="qa-answer">
                        <p>
                          <strong>Explanation:</strong> Node.js operates on a single-threaded event loop. When <code>taskEvents.emit('task-created', task)</code> is invoked, Node immediately executes the listener callback. Because the notification logic inside the listener delegates its time-consuming operation to an asynchronous API like <code>setTimeout()</code> (or asynchronous network/email I/O), the timer is scheduled in the Event Loop’s <strong>Timers phase</strong>.
                        </p>
                        <p>
                          Control returns instantly to the caller without waiting for the timer or I/O to finish. Since the HTTP response (<code>res.status(201).json()</code>) has already been dispatched into the socket buffer, the client receives the response immediately while the background work finishes later.
                        </p>
                      </div>
                    </div>

                    {/* Q2 */}
                    <div className="qa-item">
                      <div className="qa-question">
                        Q2. What would happen to API response time if the notification logic were placed directly inside the POST route instead of in an event handler?
                      </div>
                      <div className="qa-answer">
                        <p>
                          <strong>Explanation:</strong> If the notification logic (e.g., SMTP email dispatch, SMS API calls, or 2000ms delay) were placed sequentially before <code>res.status(201).json()</code>:
                        </p>
                        <ul>
                          <li>
                            The API response time would increase by at least the duration of the notification (from <strong>~15ms to &gt;2015ms</strong>).
                          </li>
                          <li>
                            Every client would be forced to wait for secondary side-effects to conclude before receiving confirmation that their task was saved.
                          </li>
                          <li>
                            If the notification service suffered network latency or outages, the main request would hang or fail entirely, degrading user experience.
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Q3 */}
                    <div className="qa-item">
                      <div className="qa-question">
                        Q3. Why is EventEmitter a reasonable choice for this scale of application, but not for a production system handling millions of events per day?
                      </div>
                      <div className="qa-answer">
                        <p>
                          <strong>Explanation:</strong>
                        </p>
                        <ul>
                          <li>
                            <strong>Why it works here:</strong> <code>EventEmitter</code> is built directly into Node.js, requires zero external services (no Redis/RabbitMQ setup), has near-zero overhead, and is perfect for in-process decoupling in single-instance apps.
                          </li>
                          <li>
                            <strong>Why it fails at million-event production scale:</strong>
                            <ol>
                              <li>
                                <em>No Persistence:</em> Events are held purely in process RAM. If the Node.js server crashes or restarts, all pending in-flight events are permanently lost.
                              </li>
                              <li>
                                <em>Single Process Bound:</em> In a clustered or multi-container environment (e.g. Kubernetes with multiple replicas), an event emitted on Pod A cannot be consumed or coordinated by Pod B.
                              </li>
                              <li>
                                <em>No Concurrency / Rate Limiting:</em> High spikes can cause memory exhaustion and block the event loop. Production systems require distributed, persistent message brokers such as <strong>RabbitMQ, Redis Streams/BullMQ, or Apache Kafka</strong>.
                              </li>
                            </ol>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
