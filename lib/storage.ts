import { Job, PriceBook, CalcRulesConfig, ID, defaultDraft } from './types';
import { migratePriceBook, migrateCalcRules } from './migrations';
import { buildDefaultPriceBook } from './defaultPriceBook';
import { buildDefaultCalcRules } from './defaultCalcRules';

const KEYS = {
  jobs: 'scalc:jobs',
  activeJobId: 'scalc:activeJobId',
  priceBook: 'scalc:priceBook',
  calcRules: 'scalc:calcRules',
  companyInfo: 'scalc:companyInfo',
};

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Your Company Name',
  address: 'Street Address, City, ST ZIP',
  phone: '(555) 555-5555',
  email: 'info@yourcompany.com',
};

export function getCompanyInfo(): CompanyInfo {
  return { ...DEFAULT_COMPANY_INFO, ...(readJSON<Partial<CompanyInfo>>(KEYS.companyInfo) ?? {}) };
}

export function saveCompanyInfo(info: CompanyInfo): void {
  writeJSON(KEYS.companyInfo, info);
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function readJSON<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Jobs ----------

export function getJobs(): Job[] {
  return readJSON<Job[]>(KEYS.jobs) ?? [];
}

export function getJob(id: ID): Job | undefined {
  return getJobs().find((j) => j.id === id);
}

export function saveJob(job: Job): void {
  const jobs = getJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.push(job);
  }
  writeJSON(KEYS.jobs, jobs);
}

export function deleteJob(id: ID): void {
  writeJSON(
    KEYS.jobs,
    getJobs().filter((j) => j.id !== id)
  );
}

export function createJob(meta: { name: string; customerName: string; salesRep: string; address: string }): Job {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const job: Job = {
    id,
    name: meta.name,
    customerName: meta.customerName,
    salesRep: meta.salesRep,
    address: meta.address,
    createdAt: now,
    updatedAt: now,
    draft: defaultDraft(id),
  };
  saveJob(job);
  return job;
}

export function getActiveJobId(): ID | null {
  return readJSON<ID>(KEYS.activeJobId);
}

export function setActiveJobId(id: ID): void {
  writeJSON(KEYS.activeJobId, id);
}

// ---------- Price book ----------

export function getPriceBook(): PriceBook {
  const migrated = migratePriceBook(readJSON<unknown>(KEYS.priceBook));
  writeJSON(KEYS.priceBook, migrated);
  return migrated;
}

export function savePriceBook(pb: PriceBook): void {
  writeJSON(KEYS.priceBook, pb);
}

export function resetPriceBookToDefaults(): PriceBook {
  const fresh = buildDefaultPriceBook();
  writeJSON(KEYS.priceBook, fresh);
  return fresh;
}

// ---------- Calc rules ----------

export function getCalcRules(): CalcRulesConfig {
  const migrated = migrateCalcRules(readJSON<unknown>(KEYS.calcRules));
  writeJSON(KEYS.calcRules, migrated);
  return migrated;
}

export function saveCalcRules(config: CalcRulesConfig): void {
  writeJSON(KEYS.calcRules, config);
}

export function resetCalcRulesToDefaults(): CalcRulesConfig {
  const fresh = buildDefaultCalcRules();
  writeJSON(KEYS.calcRules, fresh);
  return fresh;
}
