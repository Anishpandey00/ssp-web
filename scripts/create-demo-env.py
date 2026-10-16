#!/usr/bin/env python3
"""Create fresh Azure demo credentials without overwriting an existing environment."""
import os
from pathlib import Path
import secrets

target = Path(__file__).resolve().parent.parent / ".env.azure"
content = (
    "# Azure demo only; never commit or share this file.\n"
    "DB_USER=postgres\n"
    "DB_NAME=smart_study_planner\n"
    f"DB_PASSWORD={secrets.token_hex(24)}\n"
    f"JWT_SECRET={secrets.token_hex(48)}\n"
    "ADMIN_EMAIL=admin@example.test\n"
    f"ADMIN_PASSWORD={secrets.token_hex(16)}\n"
)
try:
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
except FileExistsError:
    raise SystemExit(".env.azure already exists; kept it unchanged. Do not regenerate database credentials.")
with os.fdopen(fd, "w") as output:
    output.write(content)
print("Created .env.azure with private file permissions. Local .env was not changed.")
print("Read ADMIN_EMAIL and ADMIN_PASSWORD in that file privately when signing in.")
