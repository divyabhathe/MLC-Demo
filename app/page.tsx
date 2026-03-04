"use client";
import React, { useState } from 'react';

export default function ChatBot() {
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hello! How can I help you today?' }]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message to UI
    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    // Placeholder for backend integration
    console.log("Backend team will handle the AI logic here.");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4 items-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl flex flex-col h-[80vh]">
        
        {/* Output Field (Chat History) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Field */}
        <div className="border-t p-4 flex gap-2">
          <input 
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
          />
          <button onClick={handleSend} className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
