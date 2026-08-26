import { CARDS } from '../data/cards';
import { SUPPLY_PROFILES } from '../data/supplyProfiles';

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

const globalObjectGraph = (): WeakSet<object> => {
  const objects = new WeakSet<object>();
  const visit = (value: unknown): void => {
    if (!isObject(value) || objects.has(value)) return;
    objects.add(value);
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor && 'value' in descriptor) visit(descriptor.value);
    }
  };
  visit(CARDS);
  visit(SUPPLY_PROFILES);
  return objects;
};

const isDenseArrayKey = (key: PropertyKey, length: number): boolean => (
  typeof key === 'string' && key !== '' && String(Number(key)) === key && Number.isInteger(Number(key))
    && Number(key) >= 0 && Number(key) < length
);

const descriptorIsData = (
  descriptor: PropertyDescriptor | undefined,
  enumerable: boolean,
): descriptor is PropertyDescriptor & { value: unknown } => {
  if (!descriptor || !('value' in descriptor)) return false;
  return descriptor.enumerable === enumerable;
};

/** Ensures an audit pair owns every nested evidence object and uses data properties only. */
export const hasOwnedAuditEvidence = (root: unknown): boolean => {
  const seen = new WeakSet<object>();
  const globals = globalObjectGraph();
  const visit = (value: unknown): boolean => {
    if (!isObject(value)) return true;
    if (globals.has(value) || seen.has(value)) return false;
    seen.add(value);
    try {
      const keys = Reflect.ownKeys(value);
      if (Array.isArray(value)) {
        const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
        if (!lengthDescriptor || !descriptorIsData(lengthDescriptor, false) || lengthDescriptor.value !== value.length) return false;
        if (keys.length !== value.length + 1) return false;
        for (let index = 0; index < value.length; index += 1) {
          const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
          if (!descriptor || !descriptorIsData(descriptor, true) || !visit(descriptor.value)) return false;
        }
        return keys.every((key) => key === 'length' || isDenseArrayKey(key, value.length));
      }
      if (Object.getPrototypeOf(value) !== Object.prototype) return false;
      return keys.every((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        return typeof key === 'string' && descriptorIsData(descriptor, true) && visit(descriptor.value);
      });
    } catch {
      return false;
    }
  };
  return visit(root);
};
