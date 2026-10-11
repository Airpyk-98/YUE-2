// Settings Management for NVIDIA LLM, Krea.ai Image Models, Kaggle GPU & HF Storage
import { db, doc, getDoc, setDoc } from "./firebase-config.js";

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
      "lyrics": "[verse]\nLine 1\nLine 2\n\n[chorus]\nHook 1\nHook 2\n\n[bridge]\nBridge line\n\n[chorus]\nHook 1"
    }
  ]
}

Ensure the lyrics are complete, emotional, and rhythmic. Do not omit verses or choruses.`;

// Comprehensive catalog of all verified NVIDIA NIM models (including all 80+ live API models)
export const VERIFIED_NVIDIA_MODELS = [
  {
    "id": "openai/gpt-oss-20b",
    "label": "openai/gpt-oss-20b (Recommended - Ultra-Fast Structured Lyrics)"
  },
  {
    "id": "meta/llama-3.2-11b-vision-instruct",
    "label": "meta/llama-3.2-11b-vision-instruct (Fast High-Precision Lyrics)"
  },
  {
    "id": "z-ai/glm-5.3-flash",
    "label": "z-ai/glm-5.3-flash (Reasoning Lyricist)"
  },
  {
    "id": "meta/llama-3.3-70b-instruct",
    "label": "meta/llama-3.3-70b-instruct"
  },
  {
    "id": "nvidia/llama-3.1-nemotron-70b-instruct",
    "label": "nvidia/llama-3.1-nemotron-70b-instruct"
  },
  {
    "id": "mistralai/mistral-large-2-instruct",
    "label": "mistralai/mistral-large-2-instruct"
  },
  {
    "id": "deepseek-ai/deepseek-r1",
    "label": "deepseek-ai/deepseek-r1 (DeepSeek R1 Reasoning)"
  },
  {
    "id": "deepseek-ai/deepseek-v3",
    "label": "deepseek-ai/deepseek-v3"
  },
  {
    "id": "qwen/qwen2.5-72b-instruct",
    "label": "qwen/qwen2.5-72b-instruct"
  },
  {
    "id": "01-ai/yi-large",
    "label": "01-ai/yi-large"
  },
  {
    "id": "adept/fuyu-8b",
    "label": "adept/fuyu-8b"
  },
  {
    "id": "ai21labs/jamba-1.5-large-instruct",
    "label": "ai21labs/jamba-1.5-large-instruct"
  },
  {
    "id": "aisingapore/sea-lion-7b-instruct",
    "label": "aisingapore/sea-lion-7b-instruct"
  },
  {
    "id": "bigcode/starcoder2-15b",
    "label": "bigcode/starcoder2-15b"
  },
  {
    "id": "databricks/dbrx-instruct",
    "label": "databricks/dbrx-instruct"
  },
  {
    "id": "deepseek-ai/deepseek-coder-6.7b-instruct",
    "label": "deepseek-ai/deepseek-coder-6.7b-instruct"
  },
  {
    "id": "deepseek-ai/deepseek-v4.1-flash",
    "label": "deepseek-ai/deepseek-v4.1-flash"
  },
  {
    "id": "google/codegemma-1.1-7b",
    "label": "google/codegemma-1.1-7b"
  },
  {
    "id": "google/codegemma-7b",
    "label": "google/codegemma-7b"
  },
  {
    "id": "google/deplot",
    "label": "google/deplot"
  },
  {
    "id": "google/diffusiongemma-26b-a4b-it",
    "label": "google/diffusiongemma-26b-a4b-it"
  },
  {
    "id": "google/gemma-2-27b-it",
    "label": "google/gemma-2-27b-it"
  },
  {
    "id": "google/gemma-2-9b-it",
    "label": "google/gemma-2-9b-it"
  },
  {
    "id": "google/gemma-2b",
    "label": "google/gemma-2b"
  },
  {
    "id": "google/gemma-3-12b-it",
    "label": "google/gemma-3-12b-it"
  },
  {
    "id": "google/gemma-3-4b-it",
    "label": "google/gemma-3-4b-it"
  },
  {
    "id": "google/gemma-4-31b-it",
    "label": "google/gemma-4-31b-it"
  },
  {
    "id": "google/recurrentgemma-2b",
    "label": "google/recurrentgemma-2b"
  },
  {
    "id": "ibm/granite-3.0-3b-a800m-instruct",
    "label": "ibm/granite-3.0-3b-a800m-instruct"
  },
  {
    "id": "ibm/granite-3.0-8b-instruct",
    "label": "ibm/granite-3.0-8b-instruct"
  },
  {
    "id": "ibm/granite-34b-code-instruct",
    "label": "ibm/granite-34b-code-instruct"
  },
  {
    "id": "ibm/granite-8b-code-instruct",
    "label": "ibm/granite-8b-code-instruct"
  },
  {
    "id": "meta/codellama-70b",
    "label": "meta/codellama-70b"
  },
  {
    "id": "meta/llama-3.1-8b-instruct",
    "label": "meta/llama-3.1-8b-instruct"
  },
  {
    "id": "meta/llama-3.2-11b-vision-instruct",
    "label": "meta/llama-3.2-11b-vision-instruct"
  },
  {
    "id": "meta/llama-3.2-90b-vision-instruct",
    "label": "meta/llama-3.2-90b-vision-instruct"
  },
  {
    "id": "meta/llama-guard-4-12b",
    "label": "meta/llama-guard-4-12b"
  },
  {
    "id": "meta/llama2-70b",
    "label": "meta/llama2-70b"
  },
  {
    "id": "meta/muse-glimmer-30b",
    "label": "meta/muse-glimmer-30b"
  },
  {
    "id": "microsoft/kosmos-2",
    "label": "microsoft/kosmos-2"
  },
  {
    "id": "microsoft/phi-3-vision-128k-instruct",
    "label": "microsoft/phi-3-vision-128k-instruct"
  },
  {
    "id": "microsoft/phi-3.5-moe-instruct",
    "label": "microsoft/phi-3.5-moe-instruct"
  },
  {
    "id": "mistralai/codestral-22b-instruct-v0.1",
    "label": "mistralai/codestral-22b-instruct-v0.1"
  },
  {
    "id": "mistralai/mistral-7b-instruct-v0.3",
    "label": "mistralai/mistral-7b-instruct-v0.3"
  },
  {
    "id": "mistralai/mistral-large",
    "label": "mistralai/mistral-large"
  },
  {
    "id": "mistralai/mixtral-8x22b-instruct",
    "label": "mistralai/mixtral-8x22b-instruct"
  },
  {
    "id": "mistralai/mixtral-8x22b-v0.1",
    "label": "mistralai/mixtral-8x22b-v0.1"
  },
  {
    "id": "mistralai/mixtral-8x7b-instruct",
    "label": "mistralai/mixtral-8x7b-instruct"
  },
  {
    "id": "moonshotai/kimi-k2.6",
    "label": "moonshotai/kimi-k2.6"
  },
  {
    "id": "moonshotai/kimi-k3",
    "label": "moonshotai/kimi-k3"
  },
  {
    "id": "nv-mistralai/mistral-nemo-12b-instruct",
    "label": "nv-mistralai/mistral-nemo-12b-instruct"
  },
  {
    "id": "nvidia/ai-synthetic-video-detector",
    "label": "nvidia/ai-synthetic-video-detector"
  },
  {
    "id": "nvidia/cosmos-reason2-8b",
    "label": "nvidia/cosmos-reason2-8b"
  },
  {
    "id": "nvidia/embed-qa-4",
    "label": "nvidia/embed-qa-4"
  },
  {
    "id": "nvidia/ising-calibration-1.5-31b",
    "label": "nvidia/ising-calibration-1.5-31b"
  },
  {
    "id": "nvidia/llama-3.1-nemoguard-8b-content-safety",
    "label": "nvidia/llama-3.1-nemoguard-8b-content-safety"
  },
  {
    "id": "nvidia/llama-3.1-nemoguard-8b-topic-control",
    "label": "nvidia/llama-3.1-nemoguard-8b-topic-control"
  },
  {
    "id": "nvidia/llama-3.1-nemotron-51b-instruct",
    "label": "nvidia/llama-3.1-nemotron-51b-instruct"
  },
  {
    "id": "nvidia/llama-3.1-nemotron-safety-guard-8b-v3",
    "label": "nvidia/llama-3.1-nemotron-safety-guard-8b-v3"
  },
  {
    "id": "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    "label": "nvidia/llama-3.1-nemotron-ultra-253b-v1"
  },
  {
    "id": "nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1",
    "label": "nvidia/llama-3.2-nemoretriever-1b-vlm-embed-v1"
  },
  {
    "id": "nvidia/llama-3.2-nv-embedqa-1b-v1",
    "label": "nvidia/llama-3.2-nv-embedqa-1b-v1"
  },
  {
    "id": "nvidia/llama-nemotron-embed-vl-1b-v2",
    "label": "nvidia/llama-nemotron-embed-vl-1b-v2"
  },
  {
    "id": "nvidia/llama3-chatqa-1.5-70b",
    "label": "nvidia/llama3-chatqa-1.5-70b"
  },
  {
    "id": "nvidia/mistral-nemo-minitron-8b-8k-instruct",
    "label": "nvidia/mistral-nemo-minitron-8b-8k-instruct"
  },
  {
    "id": "nvidia/nemotron-3-embed-1b",
    "label": "nvidia/nemotron-3-embed-1b"
  },
  {
    "id": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    "label": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
  },
  {
    "id": "nvidia/nemotron-3-super-120b-a12b",
    "label": "nvidia/nemotron-3-super-120b-a12b"
  },
  {
    "id": "nvidia/nemotron-3-ultra-550b-a55b",
    "label": "nvidia/nemotron-3-ultra-550b-a55b"
  },
  {
    "id": "nvidia/nemotron-3.5-content-safety",
    "label": "nvidia/nemotron-3.5-content-safety"
  },
  {
    "id": "nvidia/nemotron-3.5-lightning-30b-a3b",
    "label": "nvidia/nemotron-3.5-lightning-30b-a3b"
  },
  {
    "id": "nvidia/nemotron-4-340b-instruct",
    "label": "nvidia/nemotron-4-340b-instruct"
  },
  {
    "id": "nvidia/nemotron-4-340b-reward",
    "label": "nvidia/nemotron-4-340b-reward"
  },
  {
    "id": "nvidia/nemotron-nano-3-30b-a3b",
    "label": "nvidia/nemotron-nano-3-30b-a3b"
  },
  {
    "id": "nvidia/nemotron-parse",
    "label": "nvidia/nemotron-parse"
  },
  {
    "id": "nvidia/nemotron-parse-2.0",
    "label": "nvidia/nemotron-parse-2.0"
  },
  {
    "id": "nvidia/neva-22b",
    "label": "nvidia/neva-22b"
  },
  {
    "id": "nvidia/nv-embedqa-mistral-7b-v2",
    "label": "nvidia/nv-embedqa-mistral-7b-v2"
  },
  {
    "id": "nvidia/nvclip",
    "label": "nvidia/nvclip"
  },
  {
    "id": "nvidia/riva-translate-4b-instruct",
    "label": "nvidia/riva-translate-4b-instruct"
  },
  {
    "id": "nvidia/riva-translate-4b-instruct-v2",
    "label": "nvidia/riva-translate-4b-instruct-v2"
  },
  {
    "id": "nvidia/vila",
    "label": "nvidia/vila"
  },
  {
    "id": "openai/gpt-oss-20b",
    "label": "openai/gpt-oss-20b"
  },
  {
    "id": "poolside/laguna-xs-2.1",
    "label": "poolside/laguna-xs-2.1"
  },
  {
    "id": "snowflake/arctic-embed-l",
    "label": "snowflake/arctic-embed-l"
  },
  {
    "id": "writer/palmyra-creative-122b",
    "label": "writer/palmyra-creative-122b"
  },
  {
    "id": "writer/palmyra-fin-70b-32k",
    "label": "writer/palmyra-fin-70b-32k"
  },
  {
    "id": "writer/palmyra-med-70b",
    "label": "writer/palmyra-med-70b"
  },
  {
    "id": "writer/palmyra-med-70b-32k",
    "label": "writer/palmyra-med-70b-32k"
  },
  {
    "id": "z-ai/glm-5.3",
    "label": "z-ai/glm-5.3"
  },
  {
    "id": "z-ai/glm-5.3-flash",
    "label": "z-ai/glm-5.3-flash"
  },
  {
    "id": "zyphra/zamba2-7b-instruct",
    "label": "zyphra/zamba2-7b-instruct"
  }
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

export function populateNvidiaModelSelect(selectElement, selectedValue) {
  if (!selectElement) return;
  selectElement.innerHTML = "";

  let found = false;
  VERIFIED_NVIDIA_MODELS.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label || m.id;
    if (selectedValue && selectedValue === m.id) {
      opt.selected = true;
      found = true;
    }
    selectElement.appendChild(opt);
  });

  if (selectedValue && !found) {
    const customOpt = document.createElement("option");
    customOpt.value = selectedValue;
    customOpt.textContent = `${selectedValue} (Custom/User Model)`;
    customOpt.selected = true;
    selectElement.prepend(customOpt);
  }
}

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
  if (local) {
    try {
      return JSON.parse(local);
    } catch (_) {}
  }

  return {
    nvidia_base_url: DEFAULT_NVIDIA_BASE_URL,
    nvidia_api_key: "",
    nvidia_model: "meta/llama-3.3-70b-instruct",
    system_prompt: DEFAULT_YUE_SYSTEM_PROMPT,
    krea_api_key: "",
    krea_model: "nano-banana-pro",
    krea_aspect_ratio: "16:9",
    kaggle_username: "",
    kaggle_key: "",
    hf_token: "",
    hf_dataset_repo: ""
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const models = data.data || data;
      const ids = models.map(m => typeof m === "string" ? m : m.id).filter(Boolean);
      if (ids && ids.length > 0) {
        return { source: "live", models: ids };
      }
    }
  } catch (err) {
    console.info("Direct browser fetch restricted by NVIDIA CORS, returning full verified NIM catalog:", err);
  }

  // Return all verified models from catalog
  return {
    source: "catalog",
    models: VERIFIED_NVIDIA_MODELS.map(m => m.id),
    note: `Loaded ${VERIFIED_NVIDIA_MODELS.length} verified NVIDIA NIM models`
  };
}
