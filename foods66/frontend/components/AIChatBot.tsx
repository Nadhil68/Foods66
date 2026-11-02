
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader, User, Bot, WifiOff } from 'lucide-react';
import { useAppStore } from '../store/useStore';
import { useAuthStore } from '../store/useStore';
import { useCartStore } from '../store/useStore';
import { useNotificationStore } from '../store/useStore';
import { getChatResponseStream } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const AIChatBot: React.FC = () => {
  const { user } = useAuthStore();
  const { isOfflineMode } = useAppStore();
  const { addToCart } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: `Hi ${user?.firstName || 'there'}! I'm Chef AI. Ask me what to eat based on your profile.` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Listen for custom "ask-ai" events from other components (like FoodCard)
  useEffect(() => {
    const handleAskAI = (event: CustomEvent) => {
        const query = event.detail?.query;
        if (query) {
            setIsOpen(true);
            handleSendMessage(query);
        }
    };
    window.addEventListener('ask-ai', handleAskAI as EventListener);
    return () => window.removeEventListener('ask-ai', handleAskAI as EventListener);
  }, [user]); // Re-bind if user changes

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim() || !user) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Pass last few messages for history context (simple context window)
      const historyContext = messages.slice(-4).map(m => ({ role: m.role, text: m.text }));
      
      const newMsgId = (Date.now() + 1).toString();
      const aiMsg: Message = { id: newMsgId, role: 'model', text: '' };
      setMessages(prev => [...prev, aiMsg]);
      
      await getChatResponseStream(text, user.healthProfile, historyContext, 
        (chunkText: string) => {
          setMessages(prev => prev.map(m => m.id === newMsgId ? { ...m, text: chunkText } : m));
        },
        async (name: string, args: any) => {
          if (name === 'addToCart' && args.foodId) {
            try {
              const { foodsAPI } = await import('../services/apiService');
              const food = await foodsAPI.getById(args.foodId);
              if (food) {
                addToCart(food, args.quantity || 1);
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `I've added ${args.quantity || 1}x ${food.name} to your cart!` }]);
              }
            } catch (err) {
              console.error('Failed to add to cart via AI', err);
            }
          }
        }
      );
    } catch (error) {
      setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'model', 
          text: "I'm having trouble connecting to the AI service right now. Please check your connection." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick suggestions based on health profile
  const suggestions = user?.healthProfile.hasIssues 
    ? ["Is Biryani safe for me?", "Suggest a healthy breakfast", "Low sugar desserts?"]
    : ["High protein suggestions", "Best dinner options?", "Spicy food recommendations"];

  if (!user) return null;

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-24 right-4 z-50 flex flex-col items-end pointer-events-none max-w-[calc(100vw-2rem)]">

      {/* Chat Window */}
      <div
        className={`pointer-events-auto bg-white w-[calc(100vw-2rem)] max-w-sm sm:w-96 rounded-2xl shadow-2xl border border-orange-100 overflow-hidden transition-all duration-300 transform origin-bottom-right mb-4 ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none h-0'}`}
      >
        {/* Header */}
        <div className={`p-4 flex justify-between items-center ${isOfflineMode ? 'bg-gray-800' : 'bg-gradient-to-r from-orange-600 to-red-600'}`}>
           <div className="flex items-center text-white gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                 <Bot size={20} />
              </div>
              <div>
                 <h3 className="font-bold text-sm">Chef AI Assistant</h3>
                 <p className="text-[10px] text-white/80 flex items-center">
                    {isOfflineMode ? <><WifiOff size={8} className="mr-1"/> Offline</> : <><span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span> Online</>}
                 </p>
              </div>
           </div>
           <button 
             onClick={() => setIsOpen(false)} 
             className="text-white/80 hover:text-white transition p-2 -m-2"
             aria-label="Close Chef AI Assistant"
           >
              <X size={20} />
           </button>
        </div>

        {/* Messages */}
        <div className="h-[clamp(10rem,calc(100dvh_-_25rem),20rem)] sm:h-80 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
           {messages.map(msg => (
             <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles size={12} className="text-orange-600" />
                    </div>
                )}
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    msg.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 border border-gray-200 rounded-tl-none shadow-sm'
                }`}>
                    {msg.text}
                </div>
                {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                        <User size={12} className="text-gray-500" />
                    </div>
                )}
             </div>
           ))}
           {isLoading && (
             <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={12} className="text-orange-600" />
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex items-center gap-2">
                    <Loader size={14} className="text-orange-500 animate-spin" />
                    <span className="text-xs text-gray-400 font-medium">Thinking...</span>
                </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-100">
           {/* Quick Suggestions */}
           {messages.length < 3 && !isOfflineMode && (
               <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
                  {suggestions.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSendMessage(s)}
                        className="whitespace-nowrap text-xs bg-orange-50 text-orange-700 px-3 py-2 sm:py-1 rounded-full border border-orange-100 hover:bg-orange-100 transition"
                      >
                        {s}
                      </button>
                  ))}
               </div>
           )}
           
           <div className="flex items-center gap-2">
              <label htmlFor="food-ai-question" className="sr-only">
                Ask about food
              </label>
              <input 
                id="food-ai-question"
                name="foodAiQuestion"
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isOfflineMode ? "Ask offline assistant..." : "Ask about food..."}
                disabled={isLoading}
                className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none disabled:opacity-50"
              />
              <button 
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Send message to Chef AI"
                className="p-3 sm:p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                <Send size={16} />
              </button>
           </div>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close Chef AI Assistant" : "Open Chef AI Assistant"}
        className={`pointer-events-auto w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-gray-800 text-white rotate-90' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'}`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

export default AIChatBot;
