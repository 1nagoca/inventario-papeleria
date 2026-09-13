const STORAGE_KEY = "inventario_app_password";

export function getStoredPassword(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setStoredPassword(password: string) {
  try {
    localStorage.setItem(STORAGE_KEY, password);
  } catch {
    // localStorage no disponible (modo privado, etc.); la sesión no persiste.
  }
}

export function clearStoredPassword() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorar
  }
}
