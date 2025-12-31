
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { createChatSession, FitnessChatSession } from '../aiService';
import * as assets from '../assets';

interface AiAssistantProps {
  onRecommendation: (recommendation: string) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onRecommendation }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "READY TO DOMINATE YOUR FITNESS GOALS? TELL ME WHAT YOU'RE AIMING FOR, AND I'LL IDENTIFY YOUR PROTOCOL." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<FitnessChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSessionRef.current = createChatSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const response = await chatSessionRef.current.sendMessage(userMsg);
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
      
      // Heuristic to trigger the "Free Pass" scroll if the AI sounds conclusive
      const conclusiveKeywords = ["PROTOCOL", "LEVEL", "PINNACLE", "STARTER", "EXECUTIVE", "PERFORMANCE"];
      if (conclusiveKeywords.some(k => response.toUpperCase().includes(k))) {
          // Small delay for the user to read the message before we scroll
          setTimeout(() => onRecommendation(`Recommended Protocol based on chat: ${response.substring(0, 100)}...`), 1500);
      }
    } catch (e) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'model', text: "SYSTEM ERROR. RECALIBRATE INPUT." }]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[500px]">
            <div className="md:w-1/3 bg-gradient-to-br from-blue-900 to-slate-900 p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 text-blue-300 mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Protocol Specialist</span>
                    </div>
                    <div className="mb-6">
                        <div className="w-24 h-24 rounded-full border-4 border-blue-500/30 p-1 mb-4">
                            <img src={assets.ai_avatar} alt="Coach Bolt" className="w-full h-full rounded-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">COACH <span className="text-blue-500">BOLT</span></h3>
                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mt-4 leading-relaxed">
                           "I DON'T ACCEPT EXCUSES. I DELIVER RESULTS. PROTOCOL IDENTIFICATION READY."
                        </p>
                    </div>
                </div>
                <div className="relative z-10 hidden md:block">
                    <div className="flex items-center space-x-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Core Online (Gemini 3)</span>
                    </div>
                </div>
            </div>
            <div className="md:w-2/3 bg-slate-950 flex flex-col">
                <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-widest leading-relaxed shadow-lg ${
                                msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 rounded-2xl rounded-bl-none px-5 py-4 border border-slate-700 flex items-center gap-3">
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <div className="relative flex items-center">
                        <input 
                           type="text" 
                           disabled={isTyping}
                           value={input} 
                           onChange={(e) => setInput(e.target.value)} 
                           onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                           placeholder={isTyping ? "Analyzing biological targets..." : "Describe your primary goal..."} 
                           className="w-full bg-slate-950 border border-slate-700 text-white rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-blue-500 transition-all font-bold text-xs disabled:opacity-50" 
                        />
                        <button onClick={handleSend} disabled={!input.trim() || isTyping} className="absolute right-2 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg"><Send className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AiAssistant;