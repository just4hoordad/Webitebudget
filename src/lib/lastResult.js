// Remembers the last generated result per builder so users can reopen it.
const BUDGET_KEY = "bb_last_budget_url";
const PLAN_KEY = "bb_last_plan_result";

export const saveLastBudget = (search) => { try { localStorage.setItem(BUDGET_KEY, search); } catch { /* ignore */ } };
export const getLastBudget = () => { try { return localStorage.getItem(BUDGET_KEY); } catch { return null; } };

export const saveLastPlan = (data) => { try { localStorage.setItem(PLAN_KEY, JSON.stringify(data)); } catch { /* ignore */ } };
export const getLastPlan = () => { try { return JSON.parse(localStorage.getItem(PLAN_KEY) || "null"); } catch { return null; } };