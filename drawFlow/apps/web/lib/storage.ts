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

export function saveShapes(shapes: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(shapes);
    localStorage.setItem("drawflow:shapes", serialized);
  } catch (error) {
    console.error("Failed to save shapes to localStorage:", error);
  }
}

export function loadShapes(): unknown[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("drawflow:shapes");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Validate it's an array
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("Failed to load shapes from localStorage:", error);
    return null;
  }
}
