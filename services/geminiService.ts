
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMathTip = async (problem: string, wrongAnswer: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The student is playing a math game. They were asked "${problem}" and answered "${wrongAnswer}". Provide a one-sentence, encouraging tip or mental math trick to help them solve it correctly next time. Be brief and supportive.`,
      config: {
        systemInstruction: "You are a friendly math sensei. Your goal is to provide concise, 1-sentence mental math tips.",
        maxOutputTokens: 100,
      }
    });
    return response.text || "Keep practicing! You'll get it next time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Focus on the basics and keep trying!";
  }
};
