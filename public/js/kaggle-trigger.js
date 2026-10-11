import { YUE_WORKER_PYTHON_SCRIPT } from "./yue-worker-script.js";

export async function triggerKaggleExecution(jobId, kaggleConfig, jobPayload) {
  const username = (kaggleConfig.username || "ikechukwuebiringa").trim();
  const apiKey = (kaggleConfig.key || "").trim();

  if (!apiKey) {
    throw new Error("Kaggle API Key is not configured. Please add your Kaggle API key in Settings.");
  }

  // 1. Resolve worker script (Primary: bundled script, Fallback: static fetch)
  let scriptCode = YUE_WORKER_PYTHON_SCRIPT || "";
  if (!scriptCode || scriptCode.length < 100) {
    try {
      const res = await fetch("/yue_executor.py?v=" + Date.now(), { cache: "no-store" });
      if (res.ok) {
        scriptCode = await res.text();
      }
    } catch (err) {
      console.warn("Could not fetch remote /yue_executor.py:", err);
    }
  }

  if (!scriptCode || scriptCode.length < 100) {
    throw new Error("Could not load YuE worker python script to push to Kaggle.");
  }

  // 2. Inject target JOB_ID into top of Python script
  const headerInjection = `# Auto-injected by YuE Studio Web Dispatcher\nJOB_ID = "${jobId}"\nFIREBASE_PROJECT_ID = "epic-music-98"\n\n`;
  const finalScript = headerInjection + scriptCode;

  // 3. Prepare Kaggle SaveKernel payload
  const kernelSlug = `${username}/yue2-music-worker`;
  const payload = {
    slug: kernelSlug,
    new_title: "YuE2 Music Worker",
    text: finalScript,
    language: "python",
    kernel_type: "script",
    is_private: true,
    enable_gpu: true,
    enable_internet: true,
    machine_shape: "nvidiaTeslaT4"
  };

  // 4. Send POST to Kaggle Kernel Save API
  const endpoint = "https://api.kaggle.com/v1/kernels.KernelsApiService/SaveKernel";
  const kaggleRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!kaggleRes.ok) {
    let errBody = "";
    try {
      errBody = await kaggleRes.text();
    } catch (_) {}
    throw new Error(`Kaggle API rejected kernel push (HTTP ${kaggleRes.status}): ${errBody || kaggleRes.statusText}`);
  }

  const result = await kaggleRes.json();
  return {
    success: true,
    slug: kernelSlug,
    url: result.url || `https://www.kaggle.com/code/${kernelSlug}`,
    versionNumber: result.versionNumber || 1,
    kernelId: result.kernelId
  };
}
