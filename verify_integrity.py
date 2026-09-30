#!/usr/bin/env python3
"""
Field Test Verification Console — Independent Cryptographic Verifier
Problem Statement: SIH26231 (Digital Companion for Field Drug Testing)

This script independently verifies the tamper-evident SHA-256 integrity 
of exported field test records and evidence packages without requiring a browser.
"""

import sys
import json
import hashlib
import base64
from pathlib import Path

def print_banner():
    print("=" * 70)
    print("FIELD TEST VERIFICATION CONSOLE — INTEGRITY AUDIT TOOL")
    print("Problem Statement: SIH26231 | Standard: SHA-256 FIPS 180-4")
    print("=" * 70)

def verify_record(record_file_path: str):
    path = Path(record_file_path)
    if not path.exists():
        print(f"[ERROR] File not found: {record_file_path}")
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to parse JSON: {e}")
            sys.exit(1)

    print(f"\n[TEST DOSSIER]: {data.get('testId', 'UNKNOWN')}")
    print(f"Captured At    : {data.get('capturedAt', 'N/A')}")
    print(f"Reagent Kit    : {data.get('kitType', 'N/A')}")
    print(f"Operator ID    : {data.get('operator', {}).get('id', 'N/A')} ({data.get('operator', {}).get('name', 'N/A')})")
    print(f"Presumptive Res: {data.get('classification', {}).get('outcome', 'N/A')}")
    print(f"Location Fix   : {data.get('location', {}).get('latitude', 'N/A')}°N, {data.get('location', {}).get('longitude', 'N/A')}°E")

    image_data_url = data.get("imageDataUrl", "")
    stored_hash = data.get("integrity", {}).get("imageSha256", "").lower()

    if not image_data_url:
        print("[ERROR] No image data payload found in record.")
        sys.exit(1)

    if "," in image_data_url:
        header, base64_payload = image_data_url.split(",", 1)
    else:
        base64_payload = image_data_url

    raw_bytes = base64.b64decode(base64_payload)
    calculated_hash = hashlib.sha256(raw_bytes).hexdigest().lower()

    print("\n" + "-" * 70)
    print(f"STORED HASH     : {stored_hash}")
    print(f"CALCULATED HASH : {calculated_hash}")
    print("-" * 70)

    if stored_hash == calculated_hash:
        print("\n[SUCCESS] -> INTEGRITY VERIFIED (MATCH: EXACT BYTE EQUIVALENCE)")
        print("Status: The digital image evidence exactly matches the sealed record.")
        print("Note: SHA-256 confirms digital data integrity against post-incident tampering.")
        print("      It does not replace laboratory confirmatory testing (GC-MS / FTIR).\n")
    else:
        print("\n[ALERT] -> INTEGRITY MISMATCH DETECTED!")
        print("Status: The calculated SHA-256 hash does NOT match the stored hash.")
        print("Warning: The image file has been modified, re-compressed, or substituted.\n")

if __name__ == "__main__":
    print_banner()
    if len(sys.argv) < 2:
        print("Usage: python verify_integrity.py <path_to_evidence_package.json>")
        print("Example: python verify_integrity.py TEST-2026-8942-A_evidence_package.json")
    else:
        verify_record(sys.argv[1])
