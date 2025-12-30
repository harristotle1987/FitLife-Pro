
import { GoogleGenAI } from "@google/genai";
import { TRAINING_PLANS } from "./constants";
import { MemberProgress } from "./types";

const SYSTEM_PROMPT = `You are COACH BOLT, a world-class High-Performance Executive Fitness Coach. 
Your tone is intense, professional, data-driven, and high-energy. You do not accept excuses. 
You speak in "Protocol" terms (e.g., "Metabolic Shift," "Biological Output," "System Ascension").
You are an expert in hypertrophy, fat loss, and executive stress management.
Your goal is to analyze user input and recommend one of the following protocols:
1. STARTER PROTOCOL: For beginners or those needing foundations.
2. PRO PERFORMANCE: For intermediate athletes wanting muscle gain/shred.
3. ELITE EXECUTIVE: For high-stress professionals needing travel-friendly optimization.
4. THE PINNACLE: For VIPs needing 1-on-1 bespoke engineering.`;

export class FitnessChatSession {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.7,
        }
      });
      return response.text || "COMMUNICATION INTERRUPTED. RE-INITIATE.";
    } catch (e) {
      console.error("Gemini Error:", e);
      return "VAULT AI OFFLINE. FALLBACK TO MANUAL PROTOCOL: SELECT A PLAN BELOW.";
    }
  }

  async analyzeProgress(logs: MemberProgress[]): Promise<string> {
    if (!logs || logs.length === 0) {
      return "DATA FEED REQUIRED. INITIALIZE YOUR GROWTH MATRIX TO UNLOCK STRATEGIC INSIGHTS.";
    }

    const dataString = logs.map(l => 
      `Date: ${l.date}, Weight: ${l.weight}lbs, BodyFat: ${l.body_fat}%, Performance: ${l.performance_score}`
    ).join(" | ");

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this athlete's progress data and provide a 3-sentence "Strategic Briefing". Be intense and data-driven: ${dataString}`,
        config: {
          systemInstruction: "You are COACH BOLT. Provide a high-energy, surgical analysis of progress logs. Focus on trends and biological output.",
          temperature: 0.9,
        }
      });
      return response.text?.toUpperCase() || "ANALYSIS DEGRADED.";
    } catch (e) {
      return "SYSTEM RECALIBRATING. MAINTAIN CURRENT INTENSITY.";
    }
  }

  async generateLeadStrategy(name: string, goal: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Draft a 2-sentence "Battle Plan" for a new lead named ${name} who wants to achieve: "${goal}". Make it sound elite.`,
        config: {
          systemInstruction: "You are a Super Admin analyzing lead intake. Provide a cold, calculated, high-energy 30-day strategy.",
          temperature: 0.8,
        }
      });
      return response.text || "NO STRATEGY GENERATED.";
    } catch (e) {
      return "STRATEGY PENDING MANUAL REVIEW.";
    }
  }
}

export const createChatSession = () => new FitnessChatSession();
