import asyncio
import os
import sys
import json
import time
import uuid
import httpx
from google import genai
from raqim import RaqimClient

# Configuration and crytographic passport reesolution
GEMINI_API_KEY  = os.getenv("GEMINII_API_KEY", "")
MASTER_KEY_PATH = "./ca-keys/swarm_master.key"

if not os.path.exists(MASTER_KEY_PATH): 
    print(f"[FATAL] Master key not found at '{MASTER_KEY_PATH}'. Ensure raqim-core has booted at least once. ")
    sys.exit(1) 

# Initiate Gemini Client for causal investigation 
ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY or None 

# Initialize agent clients 
