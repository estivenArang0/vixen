const TOKEN_KEY = 'token';

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
};

export const storage = {
  getToken: (): string | null => getStorage()?.getItem(TOKEN_KEY) ?? null,
  setToken: (token: string) => getStorage()?.setItem(TOKEN_KEY, token),
  removeToken: () => getStorage()?.removeItem(TOKEN_KEY),
};
