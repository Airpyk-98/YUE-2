// Settings Management for NVIDIA LLM and Krea.ai Image Models
import { db, auth, doc, getDoc, setDoc } from "./firebase-config.js";

export const DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

export const DEFAULT_YUE_SYSTEM_PROMPT = `You are a world-class professional songwriter and music producer.
Your job is to transform song concepts into the EXACT format required by the YuE full-song music synthesis model.

CRITICAL INSTRUCTIONS:
1. Output a 5-10 word "genre" stack covering: dominant genre, subgenre, instruments, vocal timbre, and tempo/BPM (e.g., "inspiring uplifting indie pop, bright acoustic guitar, warm female vocal, 120bpm").
2. Output complete, structured "lyrics" using exact bracket section tags: [verse], [chorus], [bridge], and [outro].
3. For single songs or batch multi-song requests, return your response strictly as valid JSON adhering to this schema:

{
  "songs": [
    {
      "title": "Song Title",
      "genre": "5-10 comma-separated genre tags",
      "lyrics": "[verse]\\nLine 1\\nLine 2\\n\\n[chorus]\\nHook 1\\nHook 2\\n\\n[bridge]\\nBridge line\\n\\n[chorus]\\nHook 1"
    }
  ]
}

Ensure the lyrics are complete, emotional, and rhythmic. Do not omit verses or choruses.`;

export const VERIFIED_NVIDIA_MODELS = [
  { id: "meta/llama-3.3-70b-instruct", label: "meta/llama-3.3-70b-instruct (Recommended - Ultra High Lyric Reasoning)" },
  { id: "meta/llama-3.1-405b-instruct", label: "meta/llama-3.1-405b-instruct (Flagship 405B)" },
  { id: "meta/llama-3.1-70b-instruct", label: "meta/llama-3.1-70b-instruct (Fast & Accurate)" },
  { id: "meta/llama-3.1-8b-instruct", label: "meta/llama-3.1-8b-instruct (Ultra Fast Lightweight)" },
  { id: "nvidia/llama-3.1-nemotron-70b-instruct", label: "nvidia/llama-3.1-nemotron-70b-instruct (NVIDIA Optimized)" },
  { id: "nvidia/llama-3.1-nemotron-51b-instruct", label: "nvidia/llama-3.1-nemotron-51b-instruct (High Efficiency)" },
  { id: "mistralai/mixtral-8x22b-instruct", label: "mistralai/mixtral-8x22b-instruct (MoE Architecture)" },
  { id: "mistralai/mixtral-8x7b-instruct", label: "mistralai/mixtral-8x7b-instruct (Fast MoE)" },
  { id: "mistralai/mistral-large-2-instruct", label: "mistralai/mistral-large-2-instruct (Multilingual Lyricist)" },
  { id: "deepseek-ai/deepseek-r1", label: "deepseek-ai/deepseek-r1 (Chain-of-Thought Reasoning)" },
  { id: "deepseek-ai/deepseek-v3", label: "deepseek-ai/deepseek-v3 (General SOTA)" },
  { id: "qwen/qwen2.5-72b-instruct", label: "qwen/qwen2.5-72b-instruct (Multilingual Mastery)" },
  { id: "google/gemma-2-27b-it", label: "google/gemma-2-27b-it (Google Architecture)" },
  { id: "google/gemma-2-9b-it", label: "google/gemma-2-9b-it (Lightweight)" }
];

export const KREA_MODELS = [
  // Nano Banana Series
  { id: "nano-banana-pro", name: "Nano Banana Pro (High Resolution & Precision)", category: "Nano Banana" },
  { id: "nano-banana-2", name: "Nano Banana 2 (Google SOTA)", category: "Nano Banana" },
  { id: "nano-banana-2-1", name: "Nano Banana 2.1 (Enhanced Realism)", category: "Nano Banana" },
  // ChatGPTS Series
  { id: "chatgpt-2-image", name: "ChatGPT 2 Image Generator (Stylized)", category: "ChatGPTS" },
  { id: "chatgpts-turbo", name: "ChatGPTS Turbo (Fast Concept Art)", category: "ChatGPTS" },
  // SeedDream Series
  { id: "seedream-4-0", name: "SeedDream 4.0 (ByteDance Visual SOTA)", category: "SeedDream" },
  { id: "seedream-4-5", name: "SeedDream 4.5 (High Dynamic Range)", category: "SeedDream" },
  { id: "seedream-5-0-pro", name: "SeedDream 5.0 Pro (Photorealistic Master)", category: "SeedDream" },
  // Krea 2 Series
  { id: "krea-2-large", name: "Krea 2 Large (Raw Photorealism)", category: "Krea 2" },
  { id: "krea-2-medium", name: "Krea 2 Medium (Balanced)", category: "Krea 2" },
  { id: "krea-2-medium-turbo", name: "Krea 2 Medium Turbo (High Speed)", category: "Krea 2" }
];

export async function loadUserSettings(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid, "config", "settings"));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn("Could not fetch remote settings, checking localStorage:", err);
  }

  // Fallback to localStorage
  const local = localStorage.getItem("yue_user_settings");
  if (local) return JSON.parse(local);

  return {
    nvidia_base_url: DEFAULT_NVIDIA_BASE_URL,
    nvidia_api_key: "",
    nvidia_model: "meta/llama-3.3-70b-instruct",
    system_prompt: DEFAULT_YUE_SYSTEM_PROMPT,
    krea_api_key: "",
    krea_model: "nano-banana-pro",
    krea_aspect_ratio: "16:9"
  };
}

export async function saveUserSettings(uid, settings) {
  try {
    await setDoc(doc(db, "users", uid, "config", "settings"), settings, { merge: true });
  } catch (err) {
    console.warn("Failed to persist to Firestore, storing locally:", err);
  }
  localStorage.setItem("yue_user_settings", JSON.stringify(settings));
  return true;
}

export async function fetchNvidiaModels(baseUrl, apiKey) {
  const url = baseUrl.replace(/\/+$/, "") + "/models";
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (res.ok) {
      const data = await res.json();
      const models = data.data || data;
      const ids = models.map(m => typeof m === "string" ? m : m.id).filter(Boolean);
      if (ids && ids.length > 0) {
        return { source: "live", models: ids };
      }
    }
  } catch (err) {
    console.warn("Direct browser fetch restricted by NVIDIA CORS, falling back to verified catalog:", err);
  }

  // Graceful fallback to verified catalog (since NVIDIA API does not send browser CORS headers)
  return {
    source: "catalog",
    models: VERIFIED_NVIDIA_MODELS.map(m => m.id),
    note: "Loaded from verified NVIDIA NIM catalog"
  };
}
