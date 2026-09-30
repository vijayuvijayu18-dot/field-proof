/**
 * Test Record & Operator Storage Service
 * 
 * Manages persistent storage of field test records and operator credentials.
 * Follows strict SIH requirements:
 * - Empty state by default ("NO TEST RECORDS YET")
 * - Clear separation of real records vs demonstration records
 */

import { FieldTestRecord, OperatorProfile } from '../types';

const STORAGE_KEYS = {
  RECORDS: 'ftvc_field_test_records_v1',
  OPERATOR: 'ftvc_operator_profile_v1',
  DEMO_MODE: 'ftvc_demo_mode_enabled_v1',
};

export const DEFAULT_OPERATOR: OperatorProfile = {
  id: 'OP-IND-7049',
  name: 'Inspector V. Nair',
  badge: 'SZ-NCB-4091',
  unit: 'Field Interdiction & Forensic Response Unit',
  station: 'Southern Narcotics Command Sector 4',
  role: 'Senior Field Verification Officer'
};

export function getOperatorProfile(): OperatorProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPERATOR);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading operator profile from storage', e);
  }
  return DEFAULT_OPERATOR;
}

export function saveOperatorProfile(profile: OperatorProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.OPERATOR, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed saving operator profile', e);
  }
}

export function isDemoModeActive(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true';
  } catch (e) {
    return false;
  }
}

export function setDemoModeActive(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEMO_MODE, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Failed setting demo mode', e);
  }
}

export function getAllRecords(includeDemo: boolean = true): FieldTestRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) return [];
    const list: FieldTestRecord[] = JSON.parse(raw);
    if (!includeDemo) {
      return list.filter(r => !r.isDemoRecord);
    }
    return list;
  } catch (e) {
    console.error('Failed reading test records from storage', e);
    return [];
  }
}

export function getRecordById(idOrTestId: string): FieldTestRecord | undefined {
  const records = getAllRecords(true);
  return records.find(r => r.id === idOrTestId || r.testId === idOrTestId);
}

export function saveRecord(record: FieldTestRecord): void {
  try {
    const records = getAllRecords(true);
    // Remove duplicate if editing
    const filtered = records.filter(r => r.id !== record.id && r.testId !== record.testId);
    filtered.unshift(record); // Prepend newest
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed saving test record', e);
  }
}

export function deleteRecord(id: string): void {
  try {
    const records = getAllRecords(true);
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed deleting record', e);
  }
}

export function clearAllRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
  } catch (e) {
    console.error('Failed clearing records', e);
  }
}
