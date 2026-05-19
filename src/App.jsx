/*
   App.jsx — Main Application Component

   Top-level shell. In the demo it owns:
     - The current "viewing course" (hardcoded to one course; in Prenostik
       this comes from the URL or the user's enrolled-courses list).
     - The admin-mode flag (URL ?admin=1 → localStorage; in Prenostik this
       comes from `session.user.roles.includes('admin')`).
     - The per-course chatbot enabled/disabled map (localStorage in the
       demo; a Prisma-backed Course.chatbot_enabled column in Prenostik).
*/

import ChatWidget from "./ChatWidget";
import AdminPanel, { useAdminMode, useChatbotToggles } from "./AdminPanel";

import "./App.css";

/* In the demo we pretend the student is "currently viewing" this course.
   In Prenostik this is the active course context (from URL or session). */
const CURRENT_COURSE_ID = "cs122a";

function App() {
  // Admin mode — true if URL has ?admin=1 (persisted to localStorage).
  const { isAdmin } = useAdminMode();

  // Per-course toggle map. Defaults to enabled if no entry exists.
  const { enabledByCourse, setEnabled } = useChatbotToggles();

  // Is the chatbot enabled for the course the student is viewing?
  // Default to true so the demo "just works" before any toggle is touched.
  const isChatbotEnabled = enabledByCourse[CURRENT_COURSE_ID] !== false;

  return (
    <div className="app-container">

      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">MLC</span>
          <h1 className="header-title">My Learning Coach</h1>
        </div>
        <p className="header-subtitle">AI Learning Assistant — Prototype Demo</p>
      </header>

      {/* Main Content Area — placeholder welcome card behind the widget.
          In Prenostik this is replaced by the real dashboard. */}
      <main className="app-main">
        <div className="app-welcome">
          <h2 className="app-welcome-title">Welcome back 👋</h2>
          <p className="app-welcome-text">
            {isChatbotEnabled
              ? "Your MLC Learning Coach is ready when you are. Tap the chat icon in the bottom-right corner to start a conversation."
              : "The MLC Learning Coach has been disabled for this course by an administrator."}
          </p>
        </div>
      </main>

      {/* Admin Panel — only renders when the user is an admin.
          Add ?admin=1 to the URL to enter admin mode in the demo. */}
      {isAdmin && (
        <AdminPanel
          enabledByCourse={enabledByCourse}
          onToggle={setEnabled}
        />
      )}

      {/* Floating Chat Widget — only mounted when enabled for this course. */}
      {isChatbotEnabled && <ChatWidget />}

    </div>
  );
}

export default App;
