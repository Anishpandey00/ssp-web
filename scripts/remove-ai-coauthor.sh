#!/usr/bin/env bash
# Remove Claude's co-author trailer from GitHub main without changing any files.
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ "$(git -C "$project_dir" symbolic-ref --short HEAD)" != main ]]; then
  echo "Switch to the main branch before running this script." >&2
  exit 1
fi
local_before="$(git -C "$project_dir" rev-parse HEAD)"
remote_url="$(git -C "$project_dir" remote get-url origin)"
# HTTPS can use VS Code's GitHub sign-in without requiring an SSH key.
case "$remote_url" in
  git@github.com:*) remote_url="https://github.com/${remote_url#git@github.com:}" ;;
  ssh://git@github.com/*) remote_url="https://github.com/${remote_url#ssh://git@github.com/}" ;;
esac
cleanup_dir="$(mktemp -d "${TMPDIR:-/tmp}/ssp-history-cleanup.XXXXXX")"
mirror="$cleanup_dir/repository.git"
printf 'Fetching the latest GitHub history. Backup directory: %s\n' "$cleanup_dir"
git clone --quiet --bare --single-branch --branch main "$remote_url" "$mirror"
remote_before="$(git -C "$mirror" rev-parse refs/heads/main)"

# Map the existing local tip as well, so future pushes cannot restore old credits.
if ! git -C "$mirror" merge-base --is-ancestor "$local_before" "$remote_before"; then
  echo "Local main has unpublished commits. Stopped without changing either repository." >&2
  exit 1
fi
git -C "$mirror" bundle create "$cleanup_dir/original-history.bundle" main
export SSP_CLEANUP_COMMIT_MAP="$cleanup_dir/commit-map"
export FILTER_BRANCH_SQUELCH_WARNING=1
git -C "$mirror" filter-branch --msg-filter '
  awk '\''tolower($0) !~ /^co-authored-by:[[:space:]]*claude.*<noreply@anthropic[.]com>[[:space:]]*$/ '\''
' --commit-filter '
  rewritten=$(git commit-tree "$@") || exit 1
  printf "%s %s\n" "$GIT_COMMIT" "$rewritten" >> "$SSP_CLEANUP_COMMIT_MAP"
  printf "%s\n" "$rewritten"
' -- main

# Check every rewritten snapshot, including both sides of merges.
while read -r original rewritten; do
  if [[ "$(git -C "$mirror" rev-parse "$original^{tree}")" != "$(git -C "$mirror" rev-parse "$rewritten^{tree}")" ]]; then
    echo "A file snapshot changed unexpectedly; nothing was pushed." >&2
    exit 1
  fi
done < "$SSP_CLEANUP_COMMIT_MAP"
git -C "$mirror" log main --format=%B | awk '
  tolower($0) ~ /^co-authored-by:[[:space:]]*claude.*<noreply@anthropic[.]com>/ { found = 1 }
  END { exit found ? 1 : 0 }
'
cleaned_local="$(awk -v original="$local_before" '$1 == original { print $2 }' "$SSP_CLEANUP_COMMIT_MAP")"
[[ -n "$cleaned_local" ]]
remote_after="$(git -C "$mirror" rev-parse refs/heads/main)"

# Refuse to replace anything added on GitHub since the clone above.
git -C "$mirror" push --force-with-lease="refs/heads/main:$remote_before" origin main:main
published="$(git -C "$mirror" ls-remote origin refs/heads/main | awk '{ print $1 }')"
if [[ "$published" != "$remote_after" ]]; then
  echo "Could not verify the published commit. Original history is in $cleanup_dir." >&2
  exit 1
fi

# The mapped local tip has the identical tree, preserving the index and local edits.
git -C "$project_dir" fetch --quiet --no-tags "$mirror" +refs/heads/main:refs/remotes/origin/main
git -C "$project_dir" update-ref refs/heads/main "$cleaned_local" "$local_before"
printf '\nDone: removed Claude co-author credits from GitHub main.\n'
printf 'Original history backup: %s/original-history.bundle\n' "$cleanup_dir"
printf 'GitHub contributor displays can take about 24 hours to refresh.\n'
