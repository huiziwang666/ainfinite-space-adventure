import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MissionDebrief } from "../types";

const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || '') as string;
// Lazy initialization to avoid errors if API key is missing
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai && apiKey) {
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

const debriefSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    message: { type: Type.STRING, description: "A short, encouraging message for a child based on their score." },
    fact: { type: Type.STRING, description: "A fun, simple fact about space, asteroids, or gravity." }
  },
  required: ["message", "fact"]
};

export const generateMissionDebrief = async (score: number): Promise<MissionDebrief> => {
  const prompt = `The player (a child) just finished a game of "AInfinite Space Adventure".
  Their score was: ${score} (Score represents time survived/rocks dodged).
  
  Generate a "Mission Debrief":
  1. A very short, happy, encouraging message (e.g., "Great flying!", "Close one!", "You're a star!").
  2. A fun, simple educational space fact suitable for a 6-year-old.
  `;

  try {
    const aiInstance = getAI();
    if (!aiInstance || !apiKey) {
      // Return fallback if API key is not configured
      return { 
        message: "Mission Complete!", 
        fact: "Did you know asteroids are leftover rocks from when planets formed?" 
      };
    }

    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: debriefSchema,
        temperature: 0.9,
      },
    });

    const text = response.text;
    if (!text) return { message: "Good job!", fact: "Space is huge!" };
    
    return JSON.parse(text) as MissionDebrief;
  } catch (error) {
    console.error("Gemini Error:", error);
    return { 
      message: "Mission Complete!", 
      fact: "Did you know asteroids are leftover rocks from when planets formed?" 
    };
  }
};