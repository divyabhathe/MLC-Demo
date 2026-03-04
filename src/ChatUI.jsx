/* ============================================================
   ChatUI.jsx — Chat Interface Component
   ============================================================
   This is the main chat component where students interact
   with the MLC chatbot. It handles:
     - Displaying the conversation (message bubbles)
     - Capturing user input (text field + send button)
     - Sending messages to the backend API
     - Showing quick suggestion chips
     - Auto-scrolling to the newest message

   REACT CONCEPTS USED:
     useState  — stores data that changes over time (like variables in Angular)
     useEffect — runs code when something changes (like ngOnInit / ngOnChanges)
     useRef    — gives us a reference to a DOM element (like @ViewChild in Angular)

   BACKEND INTEGRATION NOTE:
     Right now, the API call points to a local server URL.
     When your teammates finish the backend, just update the
     API_URL constant below. Everything else stays the same.
   ============================================================ */

// ---- Imports ----
// useState:  lets us create variables that trigger a re-render when they change
// useEffect: lets us run side effects (like scrolling) when data changes
// useRef:    lets us grab a reference to a DOM element directly
import { useState, useEffect, useRef } from "react";

// Import the styles specific to this component
import "./ChatUI.css";

/* ============================================================
   CONFIGURATION — Update this when backend is ready
   ============================================================ */

// This is the URL where the backend server is running.
// During development with your teammates' Python server,
// it will be something like "http://localhost:8000".
// For the demo, we use mock responses (see handleSend below).
const API_URL = "http://localhost:8000";

/* ============================================================
   SUGGESTION CHIPS DATA
   ============================================================
   These are the quick-tap suggestions shown to the student.
   They're based on the example queries from the MLC design doc.
   Each one has a label (what the button shows) and a message
   (what actually gets sent to the chatbot).
   Keeping this as a separate array makes it easy to update later. */
const SUGGESTIONS = [
  {
    label: "Study tips",                                    // Short text shown on the chip
    message: "What study strategies helped past students?", // Full message sent to chatbot
  },
  {
    label: "Feeling stuck",
    message: "I have been studying for a long time and getting lost.",
  },
  {
    label: "Improve my grade",
    message: "I am not performing well in class. What can I do to still pass?",
  },
  {
    label: "Office hours",
    message: "Should I go to office hours? What do past students say?",
  },
];

/* ============================================================
   MOCK RESPONSES — Remove this section when backend is ready
   ============================================================
   Since the backend isn't connected yet, we simulate responses
   so the demo works standalone. These are based on the example
   responses from the MLC Chatbot Design Specification. */
const MOCK_RESPONSES = {

  // Default fallback response if no keyword matches
  default:
    "That's a great question. Based on what past students in this course have shared, " +
    "I'd suggest starting with the practice problems from this week's module and " +
    "identifying specific concepts that feel unclear. Would you like some more specific strategies?",

  // Keyword-triggered responses (checked in order)
  patterns: [
    {
      keywords: ["study", "studying", "stuck", "lost", "struggling"],
      response:
        "Past students in this class who felt the same way found that breaking their study " +
        "sessions into 25-minute focused blocks (the Pomodoro technique) helped a lot. " +
        "They also focused on doing more practice problems to identify specific areas " +
        "to ask the instructor for help. You're not alone in feeling this way — most " +
        "students hit this point around this week in the course.",
    },
    {
      keywords: ["grade", "pass", "failing", "perform", "behind"],
      response:
        "Past students in this class who were in a similar position went to TA and " +
        "professor office hours more frequently and participated more in class discussions. " +
        "Students who made these changes during weeks 5-6 saw noticeable improvement " +
        "by the end of the term. The key is consistency — even one extra office hour " +
        "visit per week made a difference.",
    },
    {
      keywords: ["office hours", "professor", "TA", "instructor", "help"],
      response:
        "According to past check-in data, students who attended office hours at least " +
        "once a week reported higher confidence in applying course concepts. The most " +
        "effective approach was coming with specific questions from homework or practice " +
        "problems rather than general 'I don't understand' requests.",
    },
    {
      keywords: ["motivat", "stress", "overwhelm", "anxious", "worried"],
      response:
        "It's completely normal to feel this way — about 60% of students in past cohorts " +
        "reported similar feelings around this point in the term. Students who found " +
        "ways to manage stress, like study groups or even short walks between sessions, " +
        "tended to bounce back. Would you like me to connect you with campus support resources?",
    },
  ],
};

/* ============================================================
   getMockResponse — Temporary function for demo mode
   ============================================================
   Searches the user's message for keywords and returns a
   matching response. Delete this when the real backend is ready. */
function getMockResponse(userMessage) {

  // Safety check: if userMessage is somehow not a string, return default
  if (!userMessage || typeof userMessage !== "string") {
    return MOCK_RESPONSES.default;
  }

  // Convert the message to lowercase so keyword matching isn't case-sensitive
  var lowerMessage = userMessage.toLowerCase();

  // Loop through each pattern and check if any keywords appear in the message
  for (var i = 0; i < MOCK_RESPONSES.patterns.length; i++) {

    var pattern = MOCK_RESPONSES.patterns[i];

    // .some() returns true if ANY keyword is found in the message
    var hasMatch = pattern.keywords.some(function (keyword) {
      return lowerMessage.includes(keyword);
    });

    // If we found a matching keyword, return that pattern's response
    if (hasMatch) {
      return pattern.response;
    }
  }

  // If no keywords matched, return the generic default response
  return MOCK_RESPONSES.default;
}

/* ============================================================
   ChatUI Component
   ============================================================ */
function ChatUI() {

  /* ----------------------------------------------------------
     STATE VARIABLES
     ----------------------------------------------------------
     useState() creates a variable + a setter function.
     When you call the setter, React re-renders the component.

     Syntax: const [value, setValue] = useState(initialValue)

     This is like declaring a property in an Angular component class,
     except React tracks changes for you automatically.
     ---------------------------------------------------------- */

  // messages: Array holding the full conversation history.
  // Each message object: { sender: "user" or "bot", text: "..." }
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi there! I'm your MLC Learning Coach. I can share insights from past students to help you study more effectively. What's on your mind?",
    },
  ]);

  // input: The current text in the input field.
  const [input, setInput] = useState("");

  // isLoading: Whether we're waiting for a response.
  const [isLoading, setIsLoading] = useState(false);

  // showSuggestions: Whether to show the quick suggestion chips.
  const [showSuggestions, setShowSuggestions] = useState(true);

  /* ----------------------------------------------------------
     REFS — Direct references to DOM elements
     Like @ViewChild in Angular or document.getElementById()
     ---------------------------------------------------------- */

  // Points to an invisible div at the bottom of the messages list
  const messagesEndRef = useRef(null);

  // Points to the text input field so we can focus it
  const inputRef = useRef(null);

  /* ----------------------------------------------------------
     EFFECTS — Run code AFTER the component renders
     The dependency array controls WHEN it runs:
       []           → once on mount (like ngOnInit)
       [messages]   → every time "messages" changes
     ---------------------------------------------------------- */

  // Auto-scroll to the bottom whenever a new message is added
  useEffect(function () {
    try {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      // Scroll failed — not critical, just skip it
    }
  }, [messages]);

  /* ----------------------------------------------------------
     HANDLER: Send a Message
     ----------------------------------------------------------
     1. Adds the user's message to the conversation
     2. Gets a response (mock for now, API later)
     3. Adds the bot's response to the conversation
     ---------------------------------------------------------- */
  async function handleSend(messageText) {

    // Use the passed-in text (from a suggestion chip) or the input field
    var text = messageText || input;

    // Don't send if the text is empty or only whitespace
    if (!text || !text.trim()) {
      return;
    }

    // Save a trimmed copy of the text
    var cleanText = text.trim();

    // Clear the input field right away
    setInput("");

    // Hide the suggestion chips
    setShowSuggestions(false);

    // Add the user's message to the conversation.
    // The spread operator (...) copies existing messages and adds the new one.
    // We pass a FUNCTION to setMessages so React uses the latest state.
    setMessages(function (prev) {
      return [...prev, { sender: "user", text: cleanText }];
    });

    // Show the typing indicator
    setIsLoading(true);

    // Default to an error message in case something goes wrong
    var botResponseText = "I'm having trouble connecting right now. Please try again in a moment.";

    try {

      // ============================================================
      // BACKEND INTEGRATION POINT
      // ============================================================
      // When your teammates' backend is running, uncomment the fetch()
      // block below and comment out or delete the mock response lines.
      // ============================================================

      /*
      // --- REAL BACKEND (uncomment when ready) ---
      var response = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanText }),
      });
      var data = await response.json();
      botResponseText = data.response;
      */

      // --- MOCK RESPONSE (delete when backend is ready) ---
      // Simulate a short network delay
      await new Promise(function (resolve) {
        setTimeout(resolve, 800);
      });

      // Get a mock response based on keywords
      botResponseText = getMockResponse(cleanText);

    } catch (error) {
      // If something goes wrong, log the error.
      // botResponseText already has a fallback message from above.
      console.error("Error sending message:", error);
    }

    // Turn off the loading indicator
    setIsLoading(false);

    // Add the bot's response to the conversation
    setMessages(function (prev) {
      return [...prev, { sender: "bot", text: botResponseText }];
    });

    // Put the cursor back in the input field
    try {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      // Focus failed — not critical
    }
  }

  /* ----------------------------------------------------------
     HANDLER: Keyboard Events
     ----------------------------------------------------------
     When the student presses Enter, send the message.
     This is like (keydown.enter) in Angular.

     ** FIX: e.preventDefault() stops the browser from doing
     anything unexpected with the Enter key (like submitting
     a form or refreshing the page). **
     ---------------------------------------------------------- */
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      // CRITICAL: Prevent the browser's default Enter behavior.
      // Without this, the page can reload and go white.
      e.preventDefault();

      // Only send if we're not already waiting for a response
      if (!isLoading) {
        handleSend();
      }
    }
  }

  /* ----------------------------------------------------------
     RENDER (JSX)
     ---------------------------------------------------------- */
  return (
    <div className="chat-container">

      {/* ---- Messages Area ---- */}
      <div className="chat-messages">

        {/* Loop through messages — like *ngFor in Angular */}
        {messages.map(function (message, index) {
          return (
            <div key={index} className={"message-row " + message.sender}>

              {/* Bot messages get a small avatar icon */}
              {message.sender === "bot" && (
                <div className="bot-avatar">MLC</div>
              )}

              {/* The message bubble */}
              <div className={"message-bubble " + message.sender}>
                {message.text}
              </div>
            </div>
          );
        })}

        {/* Typing indicator — like *ngIf in Angular */}
        {isLoading && (
          <div className="message-row bot">
            <div className="bot-avatar">MLC</div>
            <div className="typing-indicator">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        {/* Invisible scroll target at the bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* ---- Suggestion Chips ---- */}
      {showSuggestions && (
        <div className="suggestions-bar">
          {SUGGESTIONS.map(function (suggestion, index) {
            return (
              <button
                key={index}
                type="button"
                className="suggestion-chip"
                onClick={function () {
                  handleSend(suggestion.message);
                }}
              >
                {suggestion.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ---- Input Area ---- */}
      <div className="chat-input-area">
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={input}
          onChange={function (e) { setInput(e.target.value); }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          type="button"
          className="send-button"
          onClick={function () { handleSend(); }}
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </div>

    </div>
  );
}

// Export so App.jsx can import and use this component
export default ChatUI;
