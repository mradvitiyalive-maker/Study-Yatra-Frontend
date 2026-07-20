export function logAuthDebug(event: string, details?: Record<string, unknown>) {
  if (details) {
    console.log(`${event}:`, details);
    return;
  }

  console.log(event);
}
