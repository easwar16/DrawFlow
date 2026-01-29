export function getUsername() {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("drawflow:username");
  if (stored && !stored.startsWith("Guest-")) {
    return stored;
  }
  const fallback = `CosmicOtter-${Math.floor(Math.random() * 1000)}`;
  if (stored?.startsWith("Guest-")) {
    localStorage.setItem("drawflow:username", fallback);
  }
  return fallback;
}

export function setUsername(name: string) {
  localStorage.setItem("drawflow:username", name);
}
