
import { GoogleGenAI } from "@google/genai";
import { CardTone } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function generateWish(recipient: string, sender: string, tone: CardTone): Promise<string> {
  const ai = getAI();
  const prompt = `Write a ${tone} Christmas wish for ${recipient} from ${sender}. Keep it under 50 words. Focus on the joy of the holiday season. Do not use any markdown formatting, asterisks, or hashtags. Just the plain text.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "May your days be merry and bright!";
  } catch (error) {
    console.error("Error generating wish:", error);
    return "Wishing you a season filled with light and laughter. Merry Christmas!";
  }
}

export async function generateCardImage(tone: CardTone, recipient: string): Promise<string | null> {
  const ai = getAI();
  // Enhanced prompt with Santa and more festive detail
  const prompt = `A stunning, award-winning Christmas masterpiece. Style: ${tone === 'Funny' ? 'Whimsical high-detail Pixar style' : 'Elegant painterly aesthetic with warm golden hour lighting'}. Subject: A high-quality festive scene featuring a cozy winter house, Santa Claus in his sleigh in the distance, a beautifully lit pine tree, and soft falling snow. Warm candles and glowing decorations. No text. 1:1 aspect ratio. Ultra high resolution.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: prompt }],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}
