"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, User, VolumeX, Volume2, Sparkles, Settings, Moon, Sun, Monitor, Plus, History, User2, Copy, ThumbsUp, ThumbsDown, Share2, MoreVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useVoice } from '@/hooks/useVoice';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { isListening, startListening, stopListening, stopSpeaking, speak } = useVoice((text: string) => {
    handleSend(text);
  });

  const handleSend = async (content: string) => {
    if (!content.trim()) return;
    
    const userMessage = { role: 'user', content };
    setMessages((prev: {role: string, content: string}[]) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedText += chunk;

        setMessages((prev: {role: string, content: string}[]) => {
          const last = prev[prev.length - 1];
          if (last.role === 'assistant') {
            return [...prev.slice(0, -1), { role: 'assistant', content: accumulatedText }];
          }
          return [...prev, { role: 'assistant', content: accumulatedText }];
        });
      }

      // Enable text-to-speech for the complete response
      if (accumulatedText.trim()) {
        speak(accumulatedText);
        setIsSpeaking(true);
        
        // Reset speaking state when done (estimate based on text length)
        setTimeout(() => {
          setIsSpeaking(false);
        }, accumulatedText.length * 50); // Approximate 50ms per character
      }

    } catch (error) {
      console.error("Error calling API:", error);
      const errorMessage = 'Sorry, I encountered an error. Please try again.';
      setMessages((prev: {role: string, content: string}[]) => [...prev, { 
        role: 'assistant', 
        content: errorMessage 
      }]);
      // Also speak error messages
      speak(errorMessage);
      setIsSpeaking(true);
      setTimeout(() => {
        setIsSpeaking(false);
      }, 3000); // 3 seconds for error message
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <div className={`flex h-screen ${resolvedTheme === 'dark' ? 'bg-[#0e0e10]' : 'bg-white'}`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        {/* Header */}
        <div className={`border-b px-6 py-4 ${
          resolvedTheme === 'dark' 
            ? 'bg-[#1e1e20] border-[#2e2e32]' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <h1 className={`text-xl font-semibold ${
              resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}>
              ALOK AI Voice Assistant
            </h1>
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className={`text-sm ${
                    resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    Speaking...
                  </span>
                </div>
              )}
              <button 
                onClick={isSpeaking ? handleStopSpeaking : stopSpeaking} 
                className={`p-2 rounded-lg transition-colors ${
                  resolvedTheme === 'dark' 
                    ? 'hover:bg-[#2e2e32] text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                } ${isSpeaking ? 'text-red-500' : ''}`}
                title={isSpeaking ? "Stop speaking" : "Stop speaking"}
              >
                <VolumeX className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto ${
          resolvedTheme === 'dark' ? 'bg-[#0e0e10]' : 'bg-white'
        }`}>
          <div className="max-w-4xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className={`w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center shadow-2xl`}>
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className={`text-4xl font-bold mb-4 text-center ${
                  resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  ALOK AI Voice Assistant
                </h1>
                <p className={`text-xl text-center mb-12 max-w-2xl ${
                  resolvedTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Your intelligent voice-powered companion for conversations, assistance, and information.
                </p>
                
                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12">
                  <div className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                    resolvedTheme === 'dark'
                      ? 'bg-[#1e1e20] border-[#2e2e32] hover:border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300 shadow-lg'
                  }`}>
                    <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Voice Input
                    </h3>
                    <p className={`text-sm ${
                      resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Speak naturally and let AI understand your commands
                    </p>
                  </div>
                  
                  <div className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                    resolvedTheme === 'dark'
                      ? 'bg-[#1e1e20] border-[#2e2e32] hover:border-purple-500'
                      : 'bg-white border-gray-200 hover:border-purple-300 shadow-lg'
                  }`}>
                    <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Volume2 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Voice Output
                    </h3>
                    <p className={`text-sm ${
                      resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Get responses spoken back to you naturally
                    </p>
                  </div>
                  
                  <div className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${
                    resolvedTheme === 'dark'
                      ? 'bg-[#1e1e20] border-[#2e2e32] hover:border-green-500'
                      : 'bg-white border-gray-200 hover:border-green-300 shadow-lg'
                  }`}>
                    <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <Send className="w-6 h-6 text-white" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${
                      resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Smart Responses
                    </h3>
                    <p className={`text-sm ${
                      resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Intelligent answers powered by advanced AI
                    </p>
                  </div>
                </div>

                {/* Call to Action */}
                <div className={`text-center p-8 rounded-3xl border-2 border-dashed max-w-2xl w-full ${
                  resolvedTheme === 'dark'
                    ? 'border-[#2e2e32] bg-[#0e0e10]'
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  <p className={`text-lg font-medium mb-2 ${
                    resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Ready to start?
                  </p>
                  <p className={`text-sm mb-4 ${
                    resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Click the microphone button to speak or type your message below
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Mic className={`w-4 h-4 ${
                      resolvedTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <span className={`text-sm ${
                      resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Press Enter to send • Shift+Enter for new line
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m: {role: string, content: string}, i: number) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                      </div>
                    )}
                    <div className={`max-w-[85%] ${m.role === 'user' ? 'order-first' : ''}`}>
                      <div className={`p-4 rounded-2xl ${
                        m.role === 'user' 
                          ? resolvedTheme === 'dark' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-blue-500 text-white'
                          : resolvedTheme === 'dark' 
                            ? 'bg-[#1e1e20] text-gray-100 border border-[#2e2e32]' 
                            : 'bg-gray-50 text-gray-900 border border-gray-200'
                      }`}>
                        <ReactMarkdown 
                          components={{
                            p: ({children}: {children?: React.ReactNode}) => <p className="text-sm leading-relaxed">{children}</p>
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isStreaming && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <div className={`p-4 rounded-2xl ${
                      resolvedTheme === 'dark' 
                        ? 'bg-[#1e1e20] text-gray-100 border border-[#2e2e32]' 
                        : 'bg-gray-50 text-gray-900 border border-gray-200'
                    }`}>
                      <div className="flex gap-1">
                        <div className={`w-2 h-2 rounded-full animate-bounce ${
                          resolvedTheme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                        }`} style={{ animationDelay: '0ms' }}></div>
                        <div className={`w-2 h-2 rounded-full animate-bounce ${
                          resolvedTheme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                        }`} style={{ animationDelay: '150ms' }}></div>
                        <div className={`w-2 h-2 rounded-full animate-bounce ${
                          resolvedTheme === 'dark' ? 'bg-gray-400' : 'bg-gray-600'
                        }`} style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className={`border-t px-6 py-4 ${
          resolvedTheme === 'dark' 
            ? 'bg-[#1e1e20] border-[#2e2e32]' 
            : 'bg-white border-gray-200'
        }`}>
          <div className={`max-w-4xl mx-auto flex items-end gap-3 ${
            resolvedTheme === 'dark' 
              ? 'bg-[#0e0e10] border-[#2e2e32]' 
              : 'bg-gray-50 border-gray-300'
          } rounded-2xl px-4 py-3 border`}>
            <button 
              onClick={startListening} 
              className={`p-2 rounded-lg transition-colors ${
                resolvedTheme === 'dark' 
                  ? 'hover:bg-[#2e2e32] text-gray-400' 
                  : 'hover:bg-gray-200 text-gray-600'
              } ${isListening ? 'text-blue-500' : ''}`}
              title="Voice input"
            >
              {isListening ? (
                <div className="flex gap-1 h-5 items-center">
                  <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-4 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
              ) : <Mic className="w-4 h-4" />}
            </button>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Type your message... (Press Enter to send)"
              className={`flex-1 bg-transparent outline-none resize-none text-sm max-h-32 py-2 ${
                resolvedTheme === 'dark' 
                  ? 'text-gray-100 placeholder-gray-500' 
                  : 'text-gray-900 placeholder-gray-400'
              }`}
              rows={1}
              style={{ minHeight: '24px' }}
            />
            
            <button 
              onClick={() => handleSend(input)} 
              disabled={!input.trim() || isStreaming}
              className={`p-2 rounded-lg transition-all duration-200 ${
                input.trim() && !isStreaming
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : resolvedTheme === 'dark' 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className={`text-xs text-center mt-3 ${
            resolvedTheme === 'dark' ? 'text-gray-600' : 'text-gray-500'
          }`}>
            ALOK AI may make mistakes. Verify important information.
          </div>
        </div>
      </div>
    </div>
  );
}