/* 
   App.jsx — Main Application Component
   
   Kind of like Index.html, javascript

  */

// Import the ChatUI component we built (like importing a module in Angular)
import ChatUI from "./ChatUI";

// Import the CSS file for this component's styles
import "./App.css";

// The App Component
// This is a functional component -> it's just a function
// that returns what should appear on screen.

function App() {

  // Everything inside the return() is JSX -> React html
  //  (NOTE to SELF) -> differences from regular HTML:
  //   - Use "className" instead of "class" (because "class" is reserved in JS)
  //   - Use curly braces { } to insert JavaScript values
  //   - Every tag must be closed, even <img /> and <br />
  return (

    // This outer div wraps the entire application
    <div className="app-container">

      {/* Header Bar */}
      {/* top navigation bar with the MLC branding. */}

      <header className="app-header">

        {/* Left side: logo and app name */}
        <div className="header-left">

          {/* The MLC icon —> a simple styled span as a logo */}
          <span className="header-logo">MLC</span>

          {/* App title text */}
          <h1 className="header-title">My Learning Coach</h1>

        </div>

        {/* Right side: subtitle describing what this is */}
        <p className="header-subtitle">AI Learning Assistant — Prototype Demo</p>

      </header>

      {/* Main Content Area */}
      {/* This section fills the remaining space below the header. */}
      {/* The ChatUI component goes here handles all the chat logic. */}
      <main className="app-main">

        {/* Render the ChatUI component */}
        {/* like using <app-chat-ui></app-chat-ui> in Angular */}
        <ChatUI />

      </main>

    </div>
  );
}

// Export component so main.jsx can import and render
export default App;
