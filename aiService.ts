import { TRAINING_PLANS } from "./constants";
import { MemberProgress } from "./types";

/**
 * Local Rule-Based Analysis Engine
 * Replaces Gemini API with high-energy heuristic logic
 */
export class FitnessAnalysisEngine {
  
  /**
   * Generates a high-energy professional analysis based on biological trends.
   */
  static analyzeProgress(logs: MemberProgress[]): string {
    if (!logs || logs.length === 0) {
      return "DATA FEED REQUIRED. INITIALIZE YOUR GROWTH MATRIX TO UNLOCK STRATEGIC INSIGHTS.";
    }

    const latest = logs[0];
    const prev = logs[1];

    if (!prev) {
      return `BASELINE ESTABLISHED. WEIGHT: ${latest.weight}LBS | SCORE: ${latest.performance_score}. MAINTAIN PROTOCOL. CONSISTENCY IS THE ONLY PATH TO ASCENSION.`;
    }

    // Heuristic Logic
    const perfDelta = latest.performance_score - prev.performance_score;
    const fatDelta = latest.body_fat - prev.body_fat;
    const weightDelta = latest.weight - prev.weight;

    let analysis = "";

    if (perfDelta > 5) {
      analysis = "EFFICIENCY SURGING. BIOLOGICAL OUTPUT IS PEAKING. ";
    } else if (perfDelta < -5) {
      analysis = "SYSTEM FATIGUE DETECTED. RECOVERY PROTOCOLS MUST BE PRIORITIZED. ";
    } else {
      analysis = "SYSTEM STABLE. TRAJECTORY REMAINS CONSTANT. ";
    }

    if (fatDelta < 0) {
      analysis += "METABOLIC SHIFT CONFIRMED: ADIPOSE REDUCTION IN PROGRESS. ";
    }

    if (Math.abs(weightDelta) < 1 && perfDelta > 0) {
      analysis += "BODY RECOMPOSITION ENGAGED. LEAN MASS RETENTION IS OPTIMAL. ";
    }

    analysis += "RESULT: MAINTAIN CURRENT SPLIT. NO EXCUSES.";

    return analysis.toUpperCase();
  }

  /**
   * Local keyword matching for the landing page assistant
   */
  static getProtocolRecommendation(input: string): string {
    const text = input.toLowerCase();
    
    if (text.includes("muscle") || text.includes("bulk") || text.includes("strength")) {
      return "PRO PERFORMANCE PROTOCOL DETECTED. HIGH-INTENSITY HYPERTROPHY IS YOUR PATH. SELECT THE PLAN BELOW TO BEGIN.";
    }
    if (text.includes("weight") || text.includes("fat") || text.includes("lean")) {
      return "METABOLIC OPTIMIZATION REQUIRED. THE STARTER OR EXECUTIVE PROTOCOL WILL SHRED YOUR BASELINE. INITIATE NOW.";
    }
    if (text.includes("busy") || text.includes("work") || text.includes("executive") || text.includes("travel")) {
      return "ELITE EXECUTIVE STATUS IDENTIFIED. BESPOKE SCHEDULING AND TRAVEL PROTOCOLS ARE READY. ASCEND TO EXECUTIVE LEVEL BELOW.";
    }
    if (text.includes("best") || text.includes("vip") || text.includes("everything")) {
      return "THE PINNACLE. BESPOKE HUMAN ENGINEERING. 1-ON-1 PRIVATE ACCESS. INITIATE THE HIGHEST LEVEL OF COACHING BELOW.";
    }

    return "GOAL ACKNOWLEDGED. TO PROVIDE SURGICAL PRECISION, ARE YOU FOCUSING ON METABOLIC LOSS, HYPERTROPHY, OR TOTAL LIFESTYLE OPTIMIZATION?";
  }
}

export class FitnessChatSession {
  async sendMessage(message: string): Promise<string> {
    return FitnessAnalysisEngine.getProtocolRecommendation(message);
  }

  analyzeProgress(logs: MemberProgress[]): string {
    return FitnessAnalysisEngine.analyzeProgress(logs);
  }
}

export const createChatSession = () => new FitnessChatSession();
