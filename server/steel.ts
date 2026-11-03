export const DEFAULT_STEEL_KEY = 
  process.env.STEEL_API_KEY || 'ste-Yn9dfeYen4z2SgJMNkrxjsDFuRZir80jAJeBqE6pODxtXCwsGU8tGoFylZOWEW6pucXqxLErhNXjYDZI7bZQZ5rbu9z7fbo5EGJ';

export const STEEL_API_BASE = 'https://api.steel.dev/v1';

export interface CreateSessionOptions {
  sessionTimeout?: number; // ms, default 300000 (5 mins)
  dimensions?: { width: number; height: number };
  useProxy?: boolean;
  solveCaptcha?: boolean;
  debugConfig?: {
    interactive?: boolean;
    systemCursor?: boolean;
  };
}

export class SteelClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || DEFAULT_STEEL_KEY;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'Steel-Api-Key': this.apiKey,
    };
  }

  async createSession(options?: CreateSessionOptions) {
    const body = {
      sessionTimeout: options?.sessionTimeout || 300000,
      dimensions: options?.dimensions || { width: 1280, height: 800 },
      debugConfig: {
        interactive: options?.debugConfig?.interactive !== false,
        systemCursor: options?.debugConfig?.systemCursor !== false,
      },
      solveCaptcha: options?.solveCaptcha ?? false,
      useProxy: options?.useProxy ?? false,
    };

    const res = await fetch(`${STEEL_API_BASE}/sessions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Steel session creation failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data;
  }

  async getSession(sessionId: string) {
    const res = await fetch(`${STEEL_API_BASE}/sessions/${sessionId}`, {
      headers: this.headers(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to get Steel session (${res.status}): ${errText}`);
    }

    return await res.json();
  }

  async releaseSession(sessionId: string) {
    try {
      const res = await fetch(`${STEEL_API_BASE}/sessions/${sessionId}/release`, {
        method: 'POST',
        headers: this.headers(),
      });
      if (!res.ok) {
        console.warn(`Steel session release warning (${res.status}):`, await res.text());
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error releasing Steel session:', err);
      return false;
    }
  }

  async listSessions() {
    const res = await fetch(`${STEEL_API_BASE}/sessions`, {
      headers: this.headers(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to list Steel sessions (${res.status}): ${errText}`);
    }

    return await res.json();
  }

  async scrape(sessionId: string, url?: string) {
    const res = await fetch(`${STEEL_API_BASE}/sessions/scrape`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ sessionId, url }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Steel scrape failed (${res.status}): ${errText}`);
    }

    return await res.json();
  }
}

export const steelClient = new SteelClient();
