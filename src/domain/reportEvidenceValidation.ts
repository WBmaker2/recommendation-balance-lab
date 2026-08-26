import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

const collectGlobalObjects = (): WeakSet<object> => {
  const globals = new WeakSet<object>();
  const visit = (value: unknown): void => {
    if (!isObject(value) || globals.has(value)) return;
    globals.add(value);
    try {
      for (const key of Reflect.ownKeys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (descriptor && 'value' in descriptor) visit(descriptor.value);
      }
    } catch {
      // A global graph is static; an inaccessible branch is rejected by the caller's traversal.
    }
  };
  visit(CARDS);
  visit(SUPPLY_PROFILES);
  return globals;
};

const isDataProperty = (value: object, key: PropertyKey, enumerable: boolean): boolean => {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return Boolean(descriptor && descriptor.enumerable === enumerable && 'value' in descriptor);
};

const visitArray = (value: readonly unknown[], visit: (item: unknown) => boolean): boolean => {
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1 || !keys.includes('length') || !isDataProperty(value, 'length', false)) return false;
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!isDataProperty(value, String(index), true) || !descriptor || !visit(descriptor.value)) return false;
  }
  return keys.every((key) => key === 'length' || (
    typeof key === 'string' && String(Number(key)) === key && Number.isInteger(Number(key))
      && Number(key) >= 0 && Number(key) < value.length
  ));
};

/** Rejects accessors, cycles, aliases, globals, and non-plain evidence objects. */
export const isSafeReportEvidenceGraph = (roots: readonly unknown[]): boolean => {
  if (!Array.isArray(roots)) return false;
  const globals = collectGlobalObjects();
  const seen = new WeakSet<object>();
  const visit = (value: unknown): boolean => {
    if (!isObject(value)) return true;
    if (globals.has(value) || seen.has(value)) return false;
    seen.add(value);
    try {
      if (Array.isArray(value)) return visitArray(value, visit);
      if (Object.getPrototypeOf(value) !== Object.prototype) return false;
      return Reflect.ownKeys(value).every((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        return typeof key === 'string' && isDataProperty(value, key, true)
          && Boolean(descriptor) && visit(descriptor!.value);
      });
    } catch {
      return false;
    }
  };
  try {
    return roots.every(visit);
  } catch {
    return false;
  }
};
