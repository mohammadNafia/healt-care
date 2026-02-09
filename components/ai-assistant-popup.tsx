'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIAssistantPopup() {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Medical AI Assistant powered by Medical Llama3 v2. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call Gradio API directly using HTTP
      const apiUrl = "https://ruslanmv-medical-llama3-v2.hf.space/api/predict";
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [
            userMessage.content, // message
            "You are a Medical AI Assistant. Please be thorough and provide an informative answer. If you don't know the answer to a specific medical inquiry, advise seeking professional help.", // system_message
            512, // max_tokens
            0.8, // temperature
            0.9, // top_p
          ],
          fn_index: 0, // /chat endpoint
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Chat API result:', result);

      // Parse response - Gradio returns { data: [...] }
      let assistantResponse = '';
      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        // The chat response is typically in the first element as a string or array
        const firstElement = result.data[0];
        if (typeof firstElement === 'string') {
          assistantResponse = firstElement;
        } else if (Array.isArray(firstElement) && firstElement.length > 0) {
          // Sometimes Gradio wraps the response in nested arrays
          assistantResponse = firstElement[0] || String(firstElement);
        } else {
          assistantResponse = String(firstElement);
        }
      } else if (typeof result.data === 'string') {
        assistantResponse = result.data;
      } else if (result.output) {
        // Alternative response format
        assistantResponse = result.output;
      } else {
        console.error('Unexpected API response format:', result);
        assistantResponse = 'I apologize, but I couldn\'t process that request. Please try again.';
      }
      
      // Clean up the response if it's empty
      if (!assistantResponse || assistantResponse.trim().length === 0) {
        assistantResponse = 'I received an empty response. Please try rephrasing your question.';
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again later or rephrase your question.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* AI Assistant Floating Button */}
      <button
        onClick={() => setShowAIAssistant(true)}
        className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 flex items-center gap-2 group"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden md:block font-semibold pr-2">AI Assistant</span>
      </button>

      {/* AI Assistant Modal/Popup */}
      {showAIAssistant && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setShowAIAssistant(false)}
        >
          <div 
            className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-3xl shadow-2xl w-full max-w-7xl my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-white/20 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Medical AI Assistant</h2>
                    <p className="text-sm text-gray-600 font-light">Powered by Medical Llama3 v2</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIAssistant(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Main Content - Matching Other Models Layout */}
            <div className="p-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Input Section - Left Side */}
                <Card className="backdrop-blur-xl bg-white/50 rounded-3xl shadow-2xl border border-white/40">
                  <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl font-extrabold text-gray-900">
                      Ask Your Question
                    </CardTitle>
                    <CardDescription className="text-base md:text-lg text-gray-800 font-light">
                      Type your medical question below
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Chat Input */}
                    <div className="space-y-4">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your medical question here..."
                        className="bg-white/80 border-white/60 rounded-xl py-6 text-base"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Quick Questions Suggestions */}
                    <div className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-white/60">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Quick Questions:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "What are the symptoms of diabetes?",
                          "How to prevent heart disease?",
                          "What is hypertension?",
                          "Explain common cold symptoms"
                        ].map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setInputMessage(suggestion)}
                            disabled={isLoading}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs transition-colors border border-blue-200 font-medium"
                          >
                            {suggestion.length > 35 ? suggestion.substring(0, 35) + '...' : suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chat Messages Section - Right Side */}
                <Card className="backdrop-blur-xl bg-white/50 rounded-3xl shadow-2xl border border-white/40">
                  <CardHeader>
                    <CardTitle className="text-2xl md:text-3xl font-extrabold text-gray-900">
                      Conversation
                    </CardTitle>
                    <CardDescription className="text-base md:text-lg text-gray-800 font-light">
                      AI-powered medical assistance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg backdrop-blur-md ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white border border-blue-500/20'
                                : 'bg-white/80 backdrop-blur-md text-gray-900 border border-white/60'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words font-light leading-relaxed">
                              {message.content}
                            </p>
                            <p className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white/80 backdrop-blur-md text-gray-900 border border-white/60 rounded-2xl px-4 py-3 shadow-lg">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Disclaimer */}
                    <div className="mt-6 bg-amber-50/80 backdrop-blur-md rounded-xl p-4 border-2 border-amber-200/60">
                      <p className="text-xs text-gray-800 leading-relaxed">
                        <strong className="font-semibold text-gray-900">Medical Disclaimer:</strong> This tool is for research and educational purposes only. 
                        It does not replace professional medical advice, diagnosis, or treatment. 
                        Always consult qualified healthcare professionals for medical decisions.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
