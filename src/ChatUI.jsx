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

  // Convert the message to lowercase so keyword matching isn't case-sensitive
  const lowerMessage = userMessage.toLowerCase();

  // Loop through each pattern and check if any keywords appear in the message
  for (const pattern of MOCK_RESPONSES.patterns) {

    // .some() returns true if ANY keyword is found in the message
    // This is like Angular's array.some() — same JavaScript method
    const hasMatch = pattern.keywords.some(function (keyword) {
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
   ============================================================
   This is the main function component. Everything inside this
   function runs every time React "renders" (redraws) the component.
   State variables trigger re-renders when they change.
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

  // messages: An array holding the full conversation history.
  // Each message is an object: { sender: "user" or "bot", text: "..." }
  // Starts with a welcome message from the bot.
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi there! I'm your MLC Learning Coach. I can share insights from past students to help you study more effectively. What's on your mind?",
    },
  ]);

  // input: The current text in the input field.
  // Updates every time the student types a character.
  const [input, setInput] = useState("");

  // isLoading: Whether we're waiting for a response from the backend.
  // When true, we show a typing indicator and disable the send button.
  const [isLoading, setIsLoading] = useState(false);

  // showSuggestions: Whether to show the quick suggestion chips.
  // We hide them after the student sends their first message
  // so the chat area has more room.
  const [showSuggestions, setShowSuggestions] = useState(true);

  /* ----------------------------------------------------------
     REFS
     ----------------------------------------------------------
     useRef() gives us a direct reference to a DOM element.
     This is like using @ViewChild('messagesEnd') in Angular
     or document.getElementById() in plain JavaScript.
     We use it to auto-scroll to the bottom of the chat.
     ---------------------------------------------------------- */

  // This ref will point to an invisible div at the bottom of the messages list
  const messagesEndRef = useRef(null);

  // This ref points to the text input field so we can focus it
  const inputRef = useRef(null);

  /* ----------------------------------------------------------
     EFFECTS (Side Effects)
     ----------------------------------------------------------
     useEffect() runs code AFTER the component renders.
     The second argument (the dependency array) controls WHEN it runs:
       - []           → runs once on mount (like ngOnInit)
       - [messages]   → runs every time "messages" changes
       - no array     → runs after every render (rarely used)
     ---------------------------------------------------------- */

  // Auto-scroll to the bottom whenever a new message is added.
  // This runs every time the "messages" array changes.
  useEffect(function () {

    // scrollIntoView smoothly scrolls so the newest message is visible
    // The ?. is "optional chaining" — it won't crash if the ref is null
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  }, [messages]); // ← dependency array: re-run this effect when "messages" changes

  /* ----------------------------------------------------------
     HANDLER: Send a Message
     ----------------------------------------------------------
     This is the core function. It:
       1. Adds the user's message to the conversation
       2. Sends it to the backend (or uses mock for demo)
       3. Adds the bot's response to the conversation

     "async" means this function can wait for the backend
     to respond without freezing the UI.
     ---------------------------------------------------------- */
  async function handleSend(messageText) {

    // Use the passed-in text (from a suggestion chip) or the input field
    const text = messageText || input;

    // Don't send if the text is empty or only whitespace
    // .trim() removes spaces from both ends of a string
    if (!text.trim()) return;

    // Create the user's message object
    const userMessage = { sender: "user", text: text };

    // Add the user's message to the conversation.
    // We use the "spread operator" (...) to copy the existing messages
    // and add the new one at the end. This creates a NEW array,
    // which tells React "something changed, re-render."
    // (In React, you should never mutate state directly — always create a copy.)
    setMessages(function (previousMessages) {
      return [...previousMessages, userMessage];
    });

    // Clear the input field after sending
    setInput("");

    // Hide the suggestion chips since the student is now chatting
    setShowSuggestions(false);

    // Show the typing indicator while we wait for a response
    setIsLoading(true);

    // ---- Get the chatbot's response ----
    try {

      let botResponseText;

      // ============================================================
      // BACKEND INTEGRATION POINT
      // ============================================================
      // When your teammates' backend is running, uncomment the fetch()
      // block below and delete the mock response line.
      //
      // The fetch() call sends a POST request to the backend server,
      // just like the HTTP requests you've made in Angular or Ionic.
      // ============================================================

      /*
      // --- REAL BACKEND (uncomment when ready) ---
      const response = await fetch(API_URL + "/chat", {
        method: "POST",                                // HTTP method
        headers: { "Content-Type": "application/json" }, // Tell server we're sending JSON
        body: JSON.stringify({                           // Convert JS object to JSON string
          message: text,                                 // The student's message
        }),
      });

      // Parse the JSON response from the server
      const data = await response.json();

      // Extract the bot's response text from the server's JSON
      botResponseText = data.response;
      */

      // --- MOCK RESPONSE (delete when backend is ready) ---
      // Simulate a short delay so it feels like a real API call
      await new Promise(function (resolve) {
        setTimeout(resolve, 800); // Wait 800 milliseconds
      });

      // Get a mock response based on keywords in the student's message
      botResponseText = getMockResponse(text);

    } catch (error) {

      // If something goes wrong (network error, server down, etc.),
      // show an error message in the chat instead of crashing
      console.error("Error sending message:", error);
      botResponseText =
        "I'm having trouble connecting right now. Please try again in a moment.";

    } finally {

      // "finally" runs whether the try succeeded or failed.
      // Turn off the loading indicator either way.
      setIsLoading(false);
    }

    // Add the bot's response to the conversation
    setMessages(function (previousMessages) {
      return [...previousMessages, { sender: "bot", text: botResponseText }];
    });

    // Put the cursor back in the input field so the student can keep typing
    inputRef.current?.focus();
  }

  /* ----------------------------------------------------------
     HANDLER: Keyboard Events
     ----------------------------------------------------------
     When the student presses Enter in the input field,
     send the message. This is like (keydown.enter) in Angular.
     ---------------------------------------------------------- */
  function handleKeyDown(event) {

    // event.key tells us which key was pressed
    if (event.key === "Enter") {
      handleSend(); // Send the current input
    }
  }

  /* ----------------------------------------------------------
     HANDLER: Suggestion Chip Click
     ----------------------------------------------------------
     When a student clicks a suggestion chip, send that
     suggestion's full message directly.
     ---------------------------------------------------------- */
  function handleSuggestionClick(suggestionMessage) {
    handleSend(suggestionMessage);
  }

  /* ----------------------------------------------------------
     RENDER (JSX)
     ----------------------------------------------------------
     Everything below is the visual output of this component.
     React calls this every time state changes and updates
     only the parts of the DOM that actually changed.
     ---------------------------------------------------------- */
  return (

    // Outer container for the entire chat interface
    <div className="chat-container">

      {/* ---- Messages Area ---- */}
      {/* This scrollable area shows the full conversation. */}
      <div className="chat-messages">

        {/* Map over the messages array and render each one.
            .map() is React's way of looping — like *ngFor in Angular.
            Each item needs a unique "key" prop so React can track it. */}
        {messages.map(function (message, index) {
          return (

            // Each message gets a wrapper div.
            // We add "user" or "bot" as a class to style them differently.
            // The "key" prop is required by React for list items — it helps
            // React know which items changed when re-rendering.
            <div key={index} className={"message-row " + message.sender}>

              {/* Bot messages get a small avatar icon */}
              {message.sender === "bot" && (
                <div className="bot-avatar">MLC</div>
              )}

              {/* The actual message bubble */}
              <div className={"message-bubble " + message.sender}>
                {message.text}
              </div>

            </div>
          );
        })}

        {/* ---- Typing Indicator ---- */}
        {/* Show animated dots when waiting for a response. */}
        {/* The && pattern is a conditional render — like *ngIf in Angular. */}
        {/* If isLoading is true, render the div. If false, render nothing. */}
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

        {/* Invisible element at the bottom — we scroll to this */}
        {/* The ref={messagesEndRef} connects this div to our useRef variable */}
        <div ref={messagesEndRef} />

      </div>

      {/* ---- Suggestion Chips ---- */}
      {/* Only shown before the student sends their first real message. */}
      {showSuggestions && (
        <div className="suggestions-bar">
          {SUGGESTIONS.map(function (suggestion, index) {
            return (
              <button
                key={index}
                className="suggestion-chip"
                onClick={function () {
                  handleSuggestionClick(suggestion.message);
                }}
              >
                {suggestion.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ---- Input Area ---- */}
      {/* The bottom bar where the student types their message. */}
      <div className="chat-input-area">

        {/* Text input field */}
        {/* ref: connects to our inputRef so we can .focus() it */}
        {/* value: controlled by the "input" state variable */}
        {/* onChange: fires every keystroke, updates the state */}
        {/* onKeyDown: listens for Enter key to send */}
        {/* disabled: prevent typing while waiting for a response */}
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={input}
          onChange={function (event) {
            setInput(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        {/* Send button */}
        {/* disabled: can't send while loading or if input is empty */}
        {/* onClick: calls handleSend with no argument (uses input state) */}
        <button
          className="send-button"
          onClick={function () {
            handleSend();
          }}
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
