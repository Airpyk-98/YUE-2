// Studio Generation Engine (Base & Advanced Batch Multi-Title Studio)
import { 
  db, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from "./firebase-config.js";
import { loadUserSettings } from "./settings.js";

let unsubscribeCurrentJob = null;

export async function dispatchAutomationJob(user, payload) {
  const jobId = "yue_" + Date.now();
  const settings = await loadUserSettings(user.uid);

  const jobDoc = {
    job_id: jobId,
    user_id: user.uid,
    user_email: user.email,
    plan_tier: user.approved_plan || user.role,
    mode: payload.mode, // "base" or "batch"
    get_video: payload.get_video,
    status: "queued",
    progress: 0,
    current_milestone: "Job submitted to queue. Awaiting Kaggle T4 worker...",
    cancel_requested: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // AI Configurations from User Profile
    nvidia_config: {
      base_url: settings.nvidia_base_url,
      api_key: settings.nvidia_api_key,
      model: settings.nvidia_model,
      system_prompt: settings.system_prompt
    },
    krea_config: {
      api_key: settings.krea_api_key,
      model: settings.krea_model,
      aspect_ratio: settings.krea_aspect_ratio
    },
    kaggle_config: {
      username: settings.kaggle_username || "",
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
