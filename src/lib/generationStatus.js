// Tiny module-level pub/sub so the always-mounted MealPlan page can broadcast
// its generation status to a floating badge shown on every other page.
// status: "idle" | "generating" | "ready" | "error"
let status = "idle";
let searchKey = null;
const listeners = new Set();

export function getGenerationStatus() {
  return { status, searchKey };
}

export function setGenerationStatus(next, key) {
  status = next;
  if (key !== undefined) searchKey = key;
  listeners.forEach((l) => l({ status, searchKey }));
}

export function subscribeGenerationStatus(cb) {
  listeners.add(cb);
  cb({ status, searchKey });
  return () => listeners.delete(cb);
}