import { ActionLog } from '../types';

export const DB_KEYS = {
  USERS: 'f66_db_users',
  ORDERS: 'f66_db_orders',
  LOGS: 'f66_db_logs',
  SESSION: 'f66_session_user',
  CART_PREFIX: 'f66_cart_',
  RECS_PREFIX: 'f66_recs_'
};

export const db = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  },
  set<T>(key: string, value: T): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(e); }
  },
  appendLog(username: string, action: ActionLog['action'], details: string) {
    try {
      const logs = db.get<ActionLog[]>(DB_KEYS.LOGS, []);
      db.set(DB_KEYS.LOGS, [{
        id: Date.now().toString(), username, action, details, timestamp: new Date().toISOString()
      }, ...logs].slice(0, 500));
    } catch (e) { console.error(e); }
  }
};
