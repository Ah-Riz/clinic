/**
 * Data Validation Utilities
 * Best Practice: Runtime validation for API responses and user input
 */

/**
 * Base validator interface
 */
interface Validator<T> {
  validate(value: unknown): value is T;
  parse(value: unknown): T;
  safeParse(value: unknown): { success: true; data: T } | { success: false; error: string };
}

/**
 * Create a validator for a specific type
 */
export function createValidator<T>(
  validateFn: (value: unknown) => value is T,
  errorMessage?: string
): Validator<T> {
  return {
    validate: validateFn,
    parse: (value: unknown): T => {
      if (!validateFn(value)) {
        throw new Error(errorMessage || 'Validation failed');
      }
      return value;
    },
    safeParse: (value: unknown) => {
      if (validateFn(value)) {
        return { success: true, data: value };
      }
      return { success: false, error: errorMessage || 'Validation failed' };
    },
  };
}

/**
 * Common validators
 */
export const validators = {
  string: createValidator<string>(
    (value): value is string => typeof value === 'string',
    'Value must be a string'
  ),

  number: createValidator<number>(
    (value): value is number => typeof value === 'number' && !isNaN(value),
    'Value must be a number'
  ),

  boolean: createValidator<boolean>(
    (value): value is boolean => typeof value === 'boolean',
    'Value must be a boolean'
  ),

  uuid: createValidator<string>(
    (value): value is string => {
      if (typeof value !== 'string') return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    },
    'Value must be a valid UUID'
  ),

  email: createValidator<string>(
    (value): value is string => {
      if (typeof value !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    'Value must be a valid email'
  ),

  date: createValidator<string>(
    (value): value is string => {
      if (typeof value !== 'string') return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    'Value must be a valid date string'
  ),

  nik: createValidator<string>(
    (value): value is string => {
      if (typeof value !== 'string') return false;
      return /^\d{16}$/.test(value);
    },
    'NIK must be 16 digits'
  ),

  phone: createValidator<string>(
    (value): value is string => {
      if (typeof value !== 'string') return false;
      return /^(\+62|0)[0-9]{9,12}$/.test(value);
    },
    'Phone number must be valid Indonesian format'
  ),

  deviceId: createValidator<string>(
    (value): value is string => {
      if (typeof value !== 'string') return false;
      return /^[A-Z]+-\d{3}$/.test(value);
    },
    'Device ID must be in format XXX-000'
  ),
};

/**
 * Validate API response structure
 */
export function validateApiResponse<T>(
  response: unknown,
  schema: { [K in keyof T]: Validator<T[K]> }
): T {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response structure');
  }

  const result = {} as T;
  const errors: string[] = [];

  for (const key in schema) {
    const validator = schema[key];
    const value = (response as any)[key];
    
    const parseResult = validator.safeParse(value);
    if (parseResult.success) {
      result[key] = parseResult.data;
    } else {
      errors.push(`${String(key)}: ${parseResult.error}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors:\n${errors.join('\n')}`);
  }

  return result;
}

/**
 * Validate array of items
 */
export function validateArray<T>(
  array: unknown,
  itemValidator: Validator<T>
): T[] {
  if (!Array.isArray(array)) {
    throw new Error('Value must be an array');
  }

  return array.map((item, index) => {
    const result = itemValidator.safeParse(item);
    if (!result.success) {
      throw new Error(`Item at index ${index}: ${result.error}`);
    }
    return result.data;
  });
}

/**
 * Optional validator wrapper
 */
export function optional<T>(
  validator: Validator<T>
): Validator<T | null | undefined> {
  return createValidator(
    (value): value is T | null | undefined => {
      if (value === null || value === undefined) return true;
      return validator.validate(value);
    },
    'Value must be null, undefined, or match the expected type'
  );
}

/**
 * Create enum validator
 */
export function enumValidator<T extends string | number>(
  values: readonly T[],
  name?: string
): Validator<T> {
  return createValidator(
    (value): value is T => values.includes(value as T),
    `Value must be one of: ${values.join(', ')}${name ? ` (${name})` : ''}`
  );
}

/**
 * Patient data validator
 */
export const patientValidator = {
  id: validators.uuid,
  nik_hash: validators.string,
  nik_hash_lookup: validators.string,
  nik_salt: validators.string,
  name: validators.string,
  dob: validators.date,
  sex: enumValidator(['male', 'female', 'unknown'] as const, 'sex'),
  phone: optional(validators.phone),
  address_enc: optional(validators.string),
};

/**
 * Visit data validator
 */
export const visitValidator = {
  id: validators.uuid,
  patient_id: validators.uuid,
  status: enumValidator([
    'registered',
    'seen_by_doctor',
    'sent_to_pharmacy',
    'completed',
    'expired'
  ] as const, 'visit status'),
  queue_date: validators.date,
};

/**
 * Medicine data validator
 */
export const medicineValidator = {
  id: validators.uuid,
  name: validators.string,
  unit: optional(validators.string),
  price: optional(validators.number),
  low_stock_threshold: validators.number,
  active: validators.boolean,
};

/**
 * RPC response validators
 */
export const rpcValidators = {
  kiosk_register: createValidator<{ queue_number: number }>(
    (value): value is { queue_number: number } => {
      if (!value || typeof value !== 'object') return false;
      const obj = value as any;
      return typeof obj.queue_number === 'number' && obj.queue_number > 0;
    },
    'Invalid registration response'
  ),

  admin_clear_expired: createValidator<{ doctor_cleared: number; pharmacy_cleared: number }>(
    (value): value is { doctor_cleared: number; pharmacy_cleared: number } => {
      if (!value || typeof value !== 'object') return false;
      const obj = value as any;
      return typeof obj.doctor_cleared === 'number' && 
             typeof obj.pharmacy_cleared === 'number';
    },
    'Invalid clear expired response'
  ),
};

/**
 * Sanitize HTML content (for display)
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  clean = clean.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
  clean = clean.replace(/on\w+\s*=\s*'[^']*'/gi, '');
  
  // Remove javascript: protocol
  clean = clean.replace(/javascript:/gi, '');
  
  return clean;
}

/**
 * Validate and sanitize form data
 */
export function validateFormData<T extends Record<string, unknown>>(
  formData: FormData | Record<string, unknown>,
  schema: { [K in keyof T]: Validator<T[K]> }
): T {
  const data: Record<string, unknown> = {};
  
  if (formData instanceof FormData) {
    formData.forEach((value, key) => {
      data[key] = value;
    });
  } else {
    Object.assign(data, formData);
  }

  // Sanitize string values
  for (const key in data) {
    if (typeof data[key] === 'string') {
      data[key] = (data[key] as string).trim();
    }
  }

  return validateApiResponse(data, schema);
}

// Export types
export type { Validator };
