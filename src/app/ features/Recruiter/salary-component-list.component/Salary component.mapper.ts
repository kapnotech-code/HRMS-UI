import { SalaryComponentResponse } from '../../../shared/models/salary-component/salary-component.model';

/**
 * Reads a value off `raw` by trying several possible key spellings,
 * case-insensitively. This protects the UI from backend casing quirks
 * (e.g. System.Text.Json's camelCase policy only lowercases the FIRST
 * letter of a property, so "SC_ComponentCode" can come back as
 * "sC_ComponentCode" instead of the expected "sc_ComponentCode").
 */
function pick(raw: Record<string, any>, candidates: string[]): any {
  const lowerMap: Record<string, any> = {};
  Object.keys(raw ?? {}).forEach(k => {
    lowerMap[k.toLowerCase()] = raw[k];
  });

  for (const key of candidates) {
    const value = lowerMap[key.toLowerCase()];
    if (value !== undefined) return value;
  }
  return undefined;
}

/**
 * Normalizes one raw API record into the shape the UI expects,
 * no matter which exact casing the backend actually sent.
 */
export function mapSalaryComponent(raw: any): SalaryComponentResponse {
  return {
    sc_Id: pick(raw, ['sc_Id', 'SC_Id', 'Id', 'id']),
    sc_ComponentCode: pick(raw, ['sc_ComponentCode', 'SC_ComponentCode', 'ComponentCode', 'componentCode']),
    sc_ComponentName: pick(raw, ['sc_ComponentName', 'SC_ComponentName', 'ComponentName', 'componentName']),
    sc_ComponentType: pick(raw, ['sc_ComponentType', 'SC_ComponentType', 'ComponentType', 'componentType']),
    sc_CalculationType: pick(raw, ['sc_CalculationType', 'SC_CalculationType', 'CalculationType', 'calculationType']),
    sc_CalculationValue: pick(raw, ['sc_CalculationValue', 'SC_CalculationValue', 'CalculationValue', 'calculationValue']),
    sc_IsTaxable: pick(raw, ['sc_IsTaxable', 'SC_IsTaxable', 'IsTaxable', 'isTaxable']),
    sc_IsActive: pick(raw, ['sc_IsActive', 'SC_IsActive', 'IsActive', 'isActive']),
    sc_CreatedAt: pick(raw, ['sc_CreatedAt', 'SC_CreatedAt', 'CreatedAt', 'createdAt']),
    sc_UpdatedAt: pick(raw, ['sc_UpdatedAt', 'SC_UpdatedAt', 'UpdatedAt', 'updatedAt']) ?? null
  };
}

export function mapSalaryComponentList(rawList: any[]): SalaryComponentResponse[] {
  return (rawList ?? []).map(mapSalaryComponent);
}
