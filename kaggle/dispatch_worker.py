#!/usr/bin/env python3
"""
Kaggle Automation Dispatcher
============================
Dispatches and manages YuE-2 compute jobs on Kaggle GPU:
1. Configures Kaggle credentials from config / environment / Firestore.
2. Formats kernel-metadata.json with user's Kaggle username.
3. Pushes kernel using Kaggle API CLI or HTTP REST API.
4. Streams logs and tracks kernel status.
"""

import os
import sys
import json
import subprocess

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
    print(f"Kaggle credentials configured for {username}")

def push_kernel(username, script_dir="kaggle"):
    meta_path = os.path.join(script_dir, "kernel-metadata.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            meta = json.load(f)
        meta["id"] = f"{username}/yue2-automation-worker"
        with open(meta_path, "w") as f:
            json.dump(meta, f, indent=2)
        print(f"Updated {meta_path} kernel id to {meta['id']}")
    
    cmd = ["kaggle", "kernels", "push", "-p", script_dir]
    print(f"Pushing Kaggle kernel: {' '.join(cmd)}")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)
    return res.returncode == 0

if __name__ == "__main__":
    username = os.environ.get("KAGGLE_USERNAME", "")
    key = os.environ.get("KAGGLE_KEY", "")
    if len(sys.argv) >= 3:
        username = sys.argv[1]
        key = sys.argv[2]
        
    if username and key:
        configure_kaggle(username, key)
        push_kernel(username)
    else:
        print("Usage: python dispatch_worker.py <kaggle_username> <kaggle_key>")
        print("Or set KAGGLE_USERNAME and KAGGLE_KEY environment variables.")
