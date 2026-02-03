import {
  ApiSettings,
  AppSettings,
  MapData,
  RPDate,
  WorldEvent,
} from "../types";
import { callModelApi, cleanJsonString } from "./geminiService";

export const generateMapData = async (
  context: string,
  config: ApiSettings,
): Promise<MapData | undefined> => {
  try {
    const prompt = `Generate a tactical grid map for: "${context}". Return valid JSON ONLY.  
Structure: {  
  "width": 10, "height": 10, "biome": "string",  
  "grid": [["#",".","."...], ...], // 10x10 Grid. Symbols: # (Wall), . (Floor), ~ (Water), + (Door), E (Enemy), $ (Loot)  
  "legend": {"#": "Wall", ".": "Floor", "~": "Water", "+": "Door", "E": "Enemy", "$": "Loot"},  
  "nodes": [  
    {"x": number, "y": number, "type": "poi" | "loot" | "enemy", "description": "string", "icon": "string"}  
  ]  
}  
Ensure the map is navigable. Add 3-5 interesting nodes.`;

    const res = await callModelApi(config, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      responseMimeType: "application/json",
    });
    const data = JSON.parse(cleanJsonString(res.text));
    return { width: 10, height: 10, ...data };
  } catch (e) {
    console.error("Map Gen Failed", e);
    return undefined;
  }
};

export const generateWorldNews = async (
  history: any[],
  settings: AppSettings,
  rpDate?: RPDate,
  worldContext?: string,
): Promise<WorldEvent | null> => {
  try {
    const langName =
      settings.user.language === "zh"
        ? "Chinese"
        : settings.user.language === "jp"
          ? "Japanese"
          : "English";
    const contextStr = worldContext ? `WORLD CONTEXT: ${worldContext}` : "";
    const prompt = `Generate a detailed world event for an RPG session.
${contextStr}
LANGUAGE: ${langName}.
Return JSON object ONLY: {headline, content, type}.
Content should be immersive, descriptive, and consistent with the world context.`;

    const res = await callModelApi(settings.api, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      responseMimeType: "application/json",
    });
    const data = JSON.parse(cleanJsonString(res.text));
    return {
      id: Date.now().toString(),
      dayCount: rpDate?.dayCount || 1,
      date: new Date().toLocaleDateString(),
      ...data,
    };
  } catch (e) {
    return null;
  }
};

export const generateCampaignSetting = async (
  keywords: string,
  settings: AppSettings,
): Promise<import("../types").WorldLore | null> => {
  const langName =
    settings.user.language === "zh"
      ? "Chinese"
      : settings.user.language === "jp"
        ? "Japanese"
        : "English";
  
  const prompt = `Generate a detailed RPG world setting based on: "${keywords}".
LANGUAGE: ${langName}.
Return valid JSON ONLY structure:
{
  "title": "Name of the World",
  "description": "General atmosphere and setting description (2-3 sentences)",
  "factions": [
    {"name": "Faction Name", "description": "Brief info"}
  ],
  "history": [
    {"era": "Year/Age", "event": "Key event"}
  ]
}`;

  try {
    const res = await callModelApi(settings.api, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      responseMimeType: "application/json"
    });
    return JSON.parse(cleanJsonString(res.text));
  } catch (e) {
    console.error("World Gen Failed", e);
    return null;
  }
};
