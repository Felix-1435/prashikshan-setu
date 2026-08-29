export type User = {
  id: number;
  username: string;
  name: string;
  role: "trainee" | "coordinator" | "admin";
  designation?: string;
  department?: string;
  email?: string;
};

const KEY = "prashikshan_setu_user";

export function saveUser(u: User) {
  sessionStorage.setItem(KEY, JSON.stringify(u));
}

export function loadUser(): User | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function clearUser() {
  sessionStorage.removeItem(KEY);
}
