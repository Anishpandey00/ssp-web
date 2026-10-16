#!/usr/bin/env python3
"""One-time sync of the reviewed local cleanup with the reviewed GitHub history.

Run manually from your terminal. Keeps both histories, creates a backup branch,
never force-pushes, and stops if GitHub has changed since the review.
"""
from datetime import datetime, timezone
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
REMOTE = "https://github.com/Anishpandey00/ssp-web.git"
REVIEWED_REMOTE = "f8f40e9978abcf72714c1d0d618e685673ff99bf"
RESOLVE_LOCAL = {"docker-compose.yml", ".github/workflows/azure-container-webapp.yml"}


def git(*args, capture=False, check=True):
    return subprocess.run(
        ["git", *args], cwd=ROOT, text=True, check=check,
        stdout=subprocess.PIPE if capture else None,
    )


def output(*args):
    return git(*args, capture=True).stdout.strip()


def stop(message):
    raise SystemExit(message)


def main():
    if output("branch", "--show-current") != "main":
        stop("Run this only on the reviewed main branch.")
    if git("rev-parse", "--verify", "-q", "MERGE_HEAD", capture=True, check=False).returncode == 0:
        stop("A merge is already in progress. Resolve it before running this script.")
    git_dir = Path(output("rev-parse", "--absolute-git-dir"))
    if any((git_dir / name).exists() for name in ("rebase-merge", "rebase-apply")):
        stop("A rebase is in progress. Resolve it first.")
    for setting in ("user.name", "user.email"):
        configured = git("config", "--get", setting, capture=True, check=False)
        if configured.returncode != 0 or not configured.stdout.strip():
            example = '"Your Name"' if setting == "user.name" else '"your GitHub email"'
            stop(f"Git {setting} is missing. Run: git config {setting} {example}, then rerun this script.")

    # Check before staging: ignored credentials must never be published.
    paths = git("ls-files", "--cached", "--others", "--exclude-standard", "-z", capture=True).stdout.split("\0")
    for name in filter(None, paths):
        path = Path(name)
        if ((path.name == ".env" or path.name.startswith(".env.")) and path.name != ".env.example") or path.suffix.lower() in {".pem", ".key", ".pfx", ".p12"}:
            stop(f"Refusing to publish a credential file: {name}")

    git("fetch", REMOTE, "main")
    remote_head = output("rev-parse", "FETCH_HEAD")
    remote_is_ancestor = git("merge-base", "--is-ancestor", remote_head, "HEAD", capture=True, check=False).returncode == 0
    if not remote_is_ancestor and remote_head != REVIEWED_REMOTE:
        stop("GitHub changed since the review. Nothing was committed or pushed; ask for another comparison.")

    git("add", "-A", "--", ".")
    if git("diff", "--cached", "--quiet", check=False).returncode != 0:
        git("commit", "-m", "Organize project and prepare three-container Azure demo")

    if not remote_is_ancestor:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        backup = f"backup/before-azure-sync-{stamp}"
        git("branch", backup)
        print(f"Saved local checkpoint: {backup}", flush=True)
        merged = git("merge", "--no-commit", "--no-ff", remote_head, check=False)
        conflicts = output("diff", "--name-only", "--diff-filter=U").splitlines()
        if set(conflicts) - RESOLVE_LOCAL:
            stop("Unexpected merge conflict. Both histories and your checkpoint are preserved. Ask for help; do not force-push.")
        for name in conflicts:
            # These two reviewed paths intentionally replace the old two-container
            # mapping and unfinished App Service template. Preserve local versions.
            git("restore", "--source=HEAD", "--staged", "--worktree", "--", name)
        if merged.returncode and not conflicts:
            stop("Merge failed. No push was attempted; inspect the Git message above.")
        git("commit", "-m", "Merge existing GitHub updates with organized Azure demo")

    subprocess.run(["npm", "test"], cwd=ROOT, check=True)
    subprocess.run(["npm", "run", "build"], cwd=ROOT, check=True)
    git("diff", "--check")
    if output("status", "--porcelain"):
        stop("Files changed during validation. No push was attempted; review git status.")
    git("push", REMOTE, "HEAD:main")
    published = output("ls-remote", REMOTE, "refs/heads/main").split()[0]
    if published != output("rev-parse", "HEAD"):
        stop("The remote changed during verification. Check GitHub before proceeding.")
    print("Verified: GitHub main now matches this local commit. No force-push was used.")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        sys.exit(f"Stopped after a command failed ({error.returncode}). Nothing was force-pushed. See the message above.")
