/*
   ChatWidget.jsx — Floating Chat Widget Wrapper

   Wraps <ChatUI /> in a glassmorphic popover that:
     - Opens from a circular trigger button in the bottom-right
     - Scales up from the button's position (transform-origin: bottom-right)
     - Has a subtle "breathing" animation on the trigger when closed
     - Closes with the same animation, plus an X button and Escape key

   This file is intentionally self-contained so it ports cleanly into the
   Prenostik host repo (see Prenostik CLAUDE.md §8). When porting:
     - Rename to ChatWidget.tsx and type the props/state.
     - Replace the inline color values with theme.palette.* and customColors.chatBg.
     - Keep ChatUI as-is — this widget never touches the chat's state contract.
*/

import { useState, useEffect, useRef } from "react";
import ChatUI from "./ChatUI";
import "./ChatWidget.css";

function ChatWidget() {
  // isOpen: whether the chat panel is visible
  const [isOpen, setIsOpen] = useState(false);

  // hasOpenedOnce: kills the breathing animation after first interaction
  // so the trigger doesn't keep pulsing forever
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // Ref to the panel for focus + click-outside if we ever add it
  const panelRef = useRef(null);

  function toggleOpen() {
    setIsOpen(function (prev) {
      return !prev;
    });
    setHasOpenedOnce(true);
  }

  function closeWidget() {
    setIsOpen(false);
  }

  // Esc key closes the panel — common pattern for popovers/modals
  useEffect(
    function () {
      function onKeyDown(e) {
        if (e.key === "Escape" && isOpen) {
          closeWidget();
        }
      }
      window.addEventListener("keydown", onKeyDown);
      return function () {
        window.removeEventListener("keydown", onKeyDown);
      };
    },
    [isOpen]
  );

  return (
    <div className="chat-widget-root">
      {/* Chat Panel */}
      {/* Always rendered so the open/close transition can play in both
          directions. Visibility is controlled via the `open` class. */}
      <div
        ref={panelRef}
        className={"chat-widget-panel " + (isOpen ? "open" : "closed")}
        role="dialog"
        aria-label="My Learning Coach chat"
        aria-hidden={!isOpen}
      >
        {/* Panel header — glassmorphic top bar with title + close button */}
        <div className="chat-widget-header">
          <div className="chat-widget-header-left">
            <span className="chat-widget-logo">MLC</span>
            <div className="chat-widget-title-group">
              <span className="chat-widget-title">My Learning Coach</span>
              <span className="chat-widget-subtitle">
                <span className="chat-widget-status-dot" />
                Online
              </span>
            </div>
          </div>
          <button
            type="button"
            className="chat-widget-close"
            onClick={closeWidget}
            aria-label="Close chat"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* The actual chat — untouched ChatUI component.
            All conversation state, mock responses, backend contract,
            auto-scroll, suggestion chips, etc. live inside ChatUI. */}
        <div className="chat-widget-body">
          <ChatUI />
        </div>
      </div>

      {/* Trigger Button */}
      {/* Glassmorphic circular button. Breathing animation only runs
          before the user has interacted, then it stops to avoid being noisy. */}
      <button
        type="button"
        className={
          "chat-widget-trigger" +
          (isOpen ? " is-open" : "") +
          (!hasOpenedOnce ? " is-breathing" : "")
        }
        onClick={toggleOpen}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
      >
        {/* Soft halo behind the button for the "breathing" effect */}
        <span className="chat-widget-trigger-halo" aria-hidden="true" />

        {/* Icon swaps between chat bubble (closed) and chevron-down (open) */}
        <span className="chat-widget-trigger-icon" aria-hidden="true">
          {isOpen ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}

export default ChatWidget;
