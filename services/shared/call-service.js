// Calls another service with the student's own login token, so that service
// applies its usual checks. Throws when it fails, answers late or says not ok.
const TIMEOUT_MS = 3000;

export async function callService(url, authorization) {
  const res = await fetch(url, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(`${url} answered ${res.status}`);
  return data;
}
