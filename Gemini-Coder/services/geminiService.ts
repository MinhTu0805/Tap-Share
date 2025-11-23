import { GoogleGenAI, Type } from "@google/genai";

// Constants
const PRO_MODEL = 'gemini-3-pro-preview';

// Initialize API Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CODE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    html: { type: Type.STRING, description: "The HTML structure only. NO <style> or <script> blocks for app logic. Must be a complete document." },
    css: { type: Type.STRING, description: "All CSS styles. Do not include <style> tags." },
    js: { type: Type.STRING, description: "All JavaScript logic. Do not include <script> tags." },
    thought: { type: Type.STRING, description: "Brief explanation of the design choices and replication strategy." }
  },
  required: ["html", "css", "js"]
};

export const analyzeUrl = async (url: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `You are a highly advanced Website Replicator. Analyze this URL: ${url}.
      
      YOUR GOAL: Create a blueprint to replicate this website PIXEL-PERFECTLY.

      Analyze specific details:
      1. **Visual Identity**: Exact background colors, font families (Google Fonts?), button styles (border-radius, shadow), and spacing system.
      2. **Structure**: Header layout, Navigation links, Hero section grid, Footer columns.
      3. **Content**: Extract the EXACT main headline, subheadlines, and button text. Do not summarize; copy the text.
      4. **Tech**: Detect if Tailwind, Bootstrap, or raw CSS is used.
      
      Output a structured architectural description that a developer can strictly follow to build a clone.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "Could not analyze website.";
    return text;
  } catch (error) {
    console.error("Error analyzing URL:", error);
    return "Failed to analyze the provided URL. Please describe the website manually.";
  }
};

export const generateCode = async (
  prompt: string, 
  currentCode: { html: string, css: string, js: string },
  imageBase64?: string,
  urlContext?: string
) => {
  try {
    let contents: any = [];

    let systemInstruction = `You are a World-Class Senior Frontend Engineer and Pixel-Perfect UI Replicator.

    CRITICAL ARCHITECTURE RULES:
    1. **SEPARATION OF CONCERNS**: 
       - Keep HTML clean. Do NOT write CSS in <style> tags inside HTML. Put it in the \`css\` field.
       - Do NOT write JS in <script> tags inside HTML. Put it in the \`js\` field.
    2. **FULL DOCUMENT**: The 'html' field MUST be a COMPLETE, valid HTML5 document starting with \`<!DOCTYPE html>\`.
    3. **HEAD SETUP**: You MUST include \`<head>\` with:
       - \`<meta charset="UTF-8">\`
       - \`<meta name="viewport" content="width=device-width, initial-scale=1.0">\`
       - Tailwind CSS CDN: \`<script src="https://cdn.tailwindcss.com"></script>\`
       - FontAwesome (if needed): \`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\`
       - Google Fonts links based on the design.
    4. **EXACT REPLICATION**: If a URL context is provided, you must COPY the layout, text, and styling exactly.
    5. **MODERN UI**: If no URL is provided, design a stunning, award-winning interface.
    
    Current Code Context:
    HTML: ${currentCode.html}
    CSS: ${currentCode.css}
    JS: ${currentCode.js}
    `;

    if (urlContext) {
      systemInstruction += `\n\n=== STRICT REPLICATION MODE ===\nBlueprint of target site:\n${urlContext}\n\nINSTRUCTION: Rebuild this website exactly as described in the blueprint. Use the exact text content and layout structure.`;
    }

    const textPart = {
      text: prompt || "Create a modern, responsive web application."
    };

    if (imageBase64) {
        contents = [
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBase64
                }
            },
            textPart
        ];
    } else {
        contents = [textPart];
    }

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: CODE_SCHEMA,
        thinkingConfig: { thinkingBudget: 16000 }, // High budget for complex replication
        systemInstruction: systemInstruction
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");

    try {
      return JSON.parse(jsonText);
    } catch (e) {
      const cleanJson = jsonText.replace(/```json/g, '').replace(/```/g, '');
      return JSON.parse(cleanJson);
    }

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};