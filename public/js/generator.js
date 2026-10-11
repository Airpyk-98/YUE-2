import { 
  db, 
  auth,
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from "./firebase-config.js";
import { loadUserSettings } from "./settings.js";
import { triggerKaggleExecution } from "./kaggle-trigger.js";

let unsubscribeCurrentJob = null;

export async function dispatchAutomationJob(user, payload) {
  const jobId = "yue_" + Date.now();
  const effectiveUid = auth.currentUser ? auth.currentUser.uid : (user.uid === "admin_master_ebiringai" ? "IHnbUVOU5JYhUtYMZF9644WRrWC3" : (user.uid || "IHnbUVOU5JYhUtYMZF9644WRrWC3"));
  const settings = await loadUserSettings(effectiveUid);

  if (!settings.kaggle_key) {
    throw new Error("Kaggle API Key is not configured. Please enter your Kaggle username and API key in Settings before launching GPU jobs.");
  }

  const jobDoc = {
    job_id: jobId,
    user_id: effectiveUid,
    user_email: user.email || (auth.currentUser ? auth.currentUser.email : "ebiringai@gmail.com"),
    plan_tier: user.approved_plan || user.role || "admin",
    mode: payload.mode, // "base" or "batch"
    get_video: payload.get_video,
    status: "queued",
    progress: 1,
    current_milestone: "Job submitted to queue. Dispatching to Kaggle T4 worker...",
    cancel_requested: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // AI Configurations from User Profile
    nvidia_config: {
      base_url: settings.nvidia_base_url,
      api_key: settings.nvidia_api_key,
      model: settings.nvidia_model || "openai/gpt-oss-20b",
      system_prompt: settings.system_prompt
    },
    krea_config: {
      api_key: settings.krea_api_key,
      model: settings.krea_model,
      aspect_ratio: settings.krea_aspect_ratio
    },
    kaggle_config: {
      username: settings.kaggle_username || "ikechukwuebiringa",
      key: settings.kaggle_key || ""
    },
    hf_config: {
      token: settings.hf_token || "",
      dataset_repo: settings.hf_dataset_repo || ""
    },

    // Song Payload
    items: payload.items
  };

  await setDoc(doc(db, "automations", jobId), jobDoc);

  // Trigger Kaggle T4 GPU directly via browser REST API
  (async () => {
    const jobRef = doc(db, "automations", jobId);
    try {
      await updateDoc(jobRef, {
        current_milestone: "🚀 Contacting Kaggle API... Pushing GPU kernel to Tesla T4 worker instance...",
        progress: 2,
        status: "running"
      });

      const res = await triggerKaggleExecution(jobId, jobDoc.kaggle_config, jobDoc);

      await updateDoc(jobRef, {
        current_milestone: `📦 Kaggle T4 worker triggered (v${res.versionNumber})! Booting GPU container...`,
        progress: 4,
        status: "running",
        kaggle_kernel_url: res.url
      });
    } catch (err) {
      console.error("Failed to trigger Kaggle worker directly:", err);
      await updateDoc(jobRef, {
        status: "failed",
        current_milestone: `❌ Kaggle dispatch failed: ${err.message}`
      });
    }
  })();

  return jobId;
}

export async function requestJobCancellation(jobId) {
  const jobRef = doc(db, "automations", jobId);
  await updateDoc(jobRef, {
    cancel_requested: true,
    status: "cancelled",
    current_milestone: "Cancellation initiated by user."
  });
}

export function attachJobMonitor(jobId, callbacks) {
  if (unsubscribeCurrentJob) unsubscribeCurrentJob();

  const jobRef = doc(db, "automations", jobId);
  unsubscribeCurrentJob = onSnapshot(jobRef, (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    callbacks.onUpdate(data);
  });

  return unsubscribeCurrentJob;
}
