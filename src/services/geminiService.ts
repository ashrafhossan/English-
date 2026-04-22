import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeText(text: string, imageBase64?: string): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert English teacher for students from Class 3 to 12. 
    Analyze the provided text or image and generate a comprehensive learning guide in Bengali and English.
    
    Follow these rules strictly:
    1. Vocabulary: List every single word from the text. For each word, provide its Bengali meaning, an English antonym, and the Bengali meaning of that antonym.
    2. Sentence Breakdown: Break down every sentence. Identify Subject, Verb, and Phrases. Provide Bengali translation for each part and then the full sentence translation.
    3. Q&A: Generate as many questions and answers as possible based on the text.
    4. Matching: Create matching pairs (left part and right part of a sentence or concept).
    5. Fill in the Blanks: Create fill-in-the-blank sentences based on the text.
    
    Return the response ONLY as a JSON object matching the specified schema.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      vocabulary: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            meaning: { type: Type.STRING },
            antonym: { type: Type.STRING },
            antonymMeaning: { type: Type.STRING }
          },
          required: ["word", "meaning", "antonym", "antonymMeaning"]
        }
      },
      sentences: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            subject: { type: Type.STRING },
            verb: { type: Type.STRING },
            phrases: { type: Type.ARRAY, items: { type: Type.STRING } },
            translation: { type: Type.STRING }
          },
          required: ["original", "subject", "verb", "phrases", "translation"]
        }
      },
      qa: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ["question", "answer"]
        }
      },
      matching: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            left: { type: Type.STRING },
            right: { type: Type.STRING }
          },
          required: ["left", "right"]
        }
      },
      blanks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING, description: "Use '____' for the blank space" },
            answer: { type: Type.STRING }
          },
          required: ["sentence", "answer"]
        }
      }
    },
    required: ["vocabulary", "sentences", "qa", "matching", "blanks"]
  };

  const contents = [];
  if (imageBase64) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64.split(",")[1]
      }
    });
  }
  contents.push({ text: text || "Analyze this content." });

  const result = await ai.models.generateContent({
    model,
    contents: { parts: contents },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema
    }
  });

  return JSON.parse(result.text || "{}");
}
