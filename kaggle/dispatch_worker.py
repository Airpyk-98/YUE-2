#!/usr/bin/env python3
"""
YuE-2 Kaggle Automation Dispatcher Daemon
=========================================
Listens to Cloud Firestore (/automations) for queued music/video synthesis jobs
and automatically triggers Kaggle T4 GPU kernel pushes.
"""

import os
import sys
import time
import json
import logging
import subprocess
import urllib.request
import urllib.error

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("yue_dispatcher")

FIREBASE_PROJECT_ID = "epic-music-98"
PROCESSED_JOBS = set()

def decode_firestore_field(val):
    if not isinstance(val, dict):
        return val
    if "stringValue" in val:
        return val["stringValue"]
    if "integerValue" in val:
        return int(val["integerValue"])
    if "booleanValue" in val:
        return val["booleanValue"]
    if "mapValue" in val:
        fields = val.get("mapValue", {}).get("fields", {})
        return {k: decode_firestore_field(v) for k, v in fields.items()}
    if "arrayValue" in val:
        values = val.get("arrayValue", {}).get("values", [])
        return [decode_firestore_field(v) for v in values]
    return val

def decode_firestore_doc(raw_doc):
    fields = raw_doc.get("fields", {})
    return {k: decode_firestore_field(v) for k, v in fields.items()}

def configure_kaggle(username, key):
    kaggle_dir = os.path.expanduser("~/.kaggle")
    os.makedirs(kaggle_dir, exist_ok=True)
    kaggle_path = os.path.join(kaggle_dir, "kaggle.json")
    with open(kaggle_path, "w") as f:
        json.dump({"username": username, "key": key}, f)
    try:
        os.chmod(kaggle_path, 0o600)
    except Exception:
        pass
    os.environ["KAGGLE_USERNAME"] = username
    os.environ["KAGGLE_KEY"] = key

def update_job_status(job_id, progress, milestone, status=None):
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/automations/{job_id}"
    fields = {
        "progress": {"integerValue": str(progress)},
        "current_milestone": {"stringValue": milestone},
        "updated_at": {"stringValue": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    }
    update_masks = ["progress", "current_milestone", "updated_at"]
    if status:
        fields["status"] = {"stringValue": status}
        update_masks.append("status")
    query = "&".join([f"updateMask.fieldPaths={m}" for m in update_masks])
    try:
        req = urllib.request.Request(
            f"{url}?{query}", 
            data=json.dumps({"fields": fields}).encode(), 
            headers={"Content-Type": "application/json"}, 
            method="PATCH"
        )
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        logger.warning(f"Could not update Firestore milestone: {e}")

def trigger_kaggle_push(job):
    job_id = job.get("job_id")
    kaggle_cfg = job.get("kaggle_config", {})
    username = kaggle_cfg.get("username") or os.environ.get("KAGGLE_USERNAME", "ikechukwuebiringa")
    key = kaggle_cfg.get("key") or os.environ.get("KAGGLE_KEY", "")

    logger.info(f"Triggering Kaggle T4 push for Job: {job_id} under user: {username}")
    update_job_status(job_id, 2, "🚀 Dispatcher detected job. Pushing kernel to Kaggle T4 GPU...", status="running")

    if username and key:
        configure_kaggle(username, key)

    # Format kernel-metadata.json
    meta_path = os.path.join("kaggle", "kernel-metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            meta = json.load(f)
        meta["id"] = f"{username}/yue2-music-worker"
        meta["title"] = "YuE2 Music Worker"
        meta["enable_gpu"] = "true"
        meta["accelerator"] = "nvidiaTeslaT4"
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)

    # Push kernel using kaggle CLI
    cmd = ["kaggle", "kernels", "push", "-p", "kaggle"]
    logger.info(f"Executing: {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    logger.info(f"Kaggle Push STDOUT: {res.stdout.strip()}")
    if res.stderr:
        logger.warning(f"Kaggle Push STDERR: {res.stderr.strip()}")

    if res.returncode == 0:
        logger.info(f"Kernel successfully launched on Kaggle T4 for {job_id}!")
        update_job_status(job_id, 5, "📦 Kernel pushed to Kaggle! Booting T4 GPU container & preparing YuE model...")
        PROCESSED_JOBS.add(job_id)
        return True
    else:
        err_msg = res.stderr.strip() or res.stdout.strip()
        logger.error(f"Push failed: {err_msg}")
        update_job_status(job_id, 0, f"Failed to push to Kaggle: {err_msg}", status="failed")
        return False

def check_queue_once():
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/automations"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            docs = data.get("documents", [])
            for d in docs:
                parsed = decode_firestore_doc(d)
                job_id = parsed.get("job_id")
                status = parsed.get("status")
                if status == "queued" and job_id not in PROCESSED_JOBS:
                    trigger_kaggle_push(parsed)
    except Exception as e:
        logger.warning(f"Poll check error: {e}")

def run_daemon(interval=4):
    logger.info("⚡ YuE-2 Kaggle Dispatcher Daemon started. Monitoring Firestore queue...")
    while True:
        try:
            check_queue_once()
        except Exception as e:
            logger.error(f"Daemon error: {e}")
        time.sleep(interval)

if __name__ == "__main__":
    if "--once" in sys.argv:
        check_queue_once()
    else:
        run_daemon()
