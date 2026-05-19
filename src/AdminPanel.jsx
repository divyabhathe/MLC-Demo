/*
   AdminPanel.jsx — Admin-only per-course chatbot toggle

   PURPOSE:
     Lets an administrator turn the MLC chatbot ON or OFF for a specific
     course. When OFF, students in that course don't see the floating
     ChatWidget at all.

   DEMO BEHAVIOR (this repo):
     - Admin mode is activated by visiting the page with `?admin=1`.
       That flag is persisted to localStorage so a refresh keeps you in
       admin mode. Visit `?admin=0` to leave admin mode.
     - The toggle state per course is persisted to localStorage so the
       page can be refreshed and the setting sticks.
     - This is a STAND-IN for real auth + a real database. It mirrors
       the API shape we'll use in the Prenostik host repo.

   PRENOSTIK PORT (TL;DR):
     - Replace the URL-flag admin check with `session.user.roles.includes('admin')`.
     - Replace localStorage with a Prisma-backed Course.chatbot_enabled column.
     - Replace the inline COURSES array with a fetch to /api/admin/courses.
     - Replace the localStorage write with a fetch to
       PATCH /api/admin/courses/:id/chat-toggle (admin-gated server-side).
*/

import { useState, useEffect } from "react";
import "./AdminPanel.css";

/* Demo courses — replace with `GET /api/admin/courses` in Prenostik. */
const DEMO_COURSES = [
  { id: "cs122a", name: "CS 122A", term: "Spring 2026" },
  { id: "informatics131", name: "INF 131", term: "Spring 2026" },
];

function AdminPanel(props) {
  // Whether the panel UI is expanded. Closed by default so it doesn't
  // dominate the page when the admin first lands.
  const [isExpanded, setIsExpanded] = useState(false);

  // Local mirror of the parent's enabledByCourse map. Reading from props
  // directly is fine, but we use local state for the optimistic toggle
  // animation feel — the parent is still the source of truth.
  const enabledByCourse = props.enabledByCourse;

  function handleToggle(courseId) {
    var current = enabledByCourse[courseId] !== false; // default: true
    props.onToggle(courseId, !current);
  }

  return (
    <div className={"admin-panel " + (isExpanded ? "expanded" : "collapsed")}>
      {/* Header — click to expand/collapse */}
      <button
        type="button"
        className="admin-panel-header"
        onClick={function () {
          setIsExpanded(function (prev) {
            return !prev;
          });
        }}
        aria-expanded={isExpanded}
      >
        <span className="admin-panel-badge">ADMIN</span>
        <span className="admin-panel-title">Chatbot Controls</span>
        <span className="admin-panel-chevron" aria-hidden="true">
          {isExpanded ? "▾" : "▸"}
        </span>
      </button>

      {/* Body — list of courses, each with an on/off switch */}
      {isExpanded && (
        <div className="admin-panel-body">
          <p className="admin-panel-hint">
            Toggle the MLC chatbot per course. When OFF, students in that
            course will not see the chat widget.
          </p>

          <ul className="admin-course-list">
            {DEMO_COURSES.map(function (course) {
              var enabled = enabledByCourse[course.id] !== false; // default true
              return (
                <li key={course.id} className="admin-course-row">
                  <div className="admin-course-info">
                    <span className="admin-course-name">{course.name}</span>
                    <span className="admin-course-term">{course.term}</span>
                  </div>

                  {/* The switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={
                      "Chatbot " +
                      (enabled ? "enabled" : "disabled") +
                      " for " +
                      course.name
                    }
                    className={"admin-switch " + (enabled ? "on" : "off")}
                    onClick={function () {
                      handleToggle(course.id);
                    }}
                  >
                    <span className="admin-switch-thumb" />
                    <span className="admin-switch-label">
                      {enabled ? "ON" : "OFF"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* useAdminMode — tiny helper hook that reads ?admin=1 from the URL once
   on mount and persists it to localStorage. Returning {isAdmin} keeps
   App.jsx clean. In Prenostik this is replaced by useSession(). */
export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(function () {
    try {
      var params = new URLSearchParams(window.location.search);
      var queryFlag = params.get("admin");
      if (queryFlag === "1") {
        localStorage.setItem("mlc_is_admin", "true");
        setIsAdmin(true);
        return;
      }
      if (queryFlag === "0") {
        localStorage.removeItem("mlc_is_admin");
        setIsAdmin(false);
        return;
      }
      var stored = localStorage.getItem("mlc_is_admin");
      setIsAdmin(stored === "true");
    } catch (err) {
      // localStorage may throw in private mode — silently default to non-admin
      setIsAdmin(false);
    }
  }, []);

  return { isAdmin: isAdmin };
}

/* useChatbotToggles — reads/writes the per-course enabled map from
   localStorage. The data shape (`{ [courseId]: boolean }`) matches what
   the Prenostik /api/courses/chat-status endpoint will return. */
export function useChatbotToggles() {
  const [enabledByCourse, setEnabledByCourse] = useState({});

  // Hydrate from localStorage on mount
  useEffect(function () {
    try {
      var raw = localStorage.getItem("mlc_chatbot_enabled");
      if (raw) {
        setEnabledByCourse(JSON.parse(raw));
      }
    } catch (err) {
      // Bad JSON — start from empty
    }
  }, []);

  function setEnabled(courseId, value) {
    setEnabledByCourse(function (prev) {
      var next = Object.assign({}, prev);
      next[courseId] = value;
      try {
        localStorage.setItem("mlc_chatbot_enabled", JSON.stringify(next));
      } catch (err) {
        // Quota or private mode — toggle still works in-memory for this session
      }
      return next;
    });
  }

  return {
    enabledByCourse: enabledByCourse,
    setEnabled: setEnabled,
  };
}

export default AdminPanel;
