export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function isValidId(value: string | undefined | null, fieldName: string = 'ID'): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `Please provide a valid ${fieldName.toLowerCase()}`,
    };
  }
  return { isValid: true };
}

export function isValidUserId(userId: string | undefined | null): ValidationResult {
  if (!userId || userId.trim() === '') {
    return {
      isValid: false,
      error: 'Your session has expired. Please sign in again.',
    };
  }
  return { isValid: true };
}

export function isValidConversationId(conversationId: string | undefined | null): ValidationResult {
  if (!conversationId || conversationId.trim() === '') {
    return {
      isValid: false,
      error: 'Unable to find conversation. Please try refreshing.',
    };
  }
  return { isValid: true };
}

export function isNonEmptyString(
  value: string | undefined | null,
  fieldName: string = 'Value'
): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} cannot be empty`,
    };
  }
  return { isValid: true };
}

export function isValidEmail(email: string | undefined | null): ValidationResult {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'Email is required',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  return { isValid: true };
}

export function hasMinLength(
  value: string | undefined | null,
  minLength: number,
  fieldName: string = 'Value'
): ValidationResult {
  if (!value) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }

  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  return { isValid: true };
}

export function hasMaxLength(
  value: string | undefined | null,
  maxLength: number,
  fieldName: string = 'Value'
): ValidationResult {
  if (value && value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be no more than ${maxLength} characters`,
    };
  }

  return { isValid: true };
}

export function validateRequired(
  value: unknown,
  fieldName: string = 'Field'
): ValidationResult {
  if (value === undefined || value === null) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }

  if (typeof value === 'string' && value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }

  return { isValid: true };
}

export function validateAll(...results: ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}

export function assertValidUserId(userId: string | undefined | null): asserts userId is string {
  const result = isValidUserId(userId);
  if (!result.isValid) {
    const error: any = new Error(result.error);
    error.status = 401;
    throw error;
  }
}

export function assertValidConversationId(
  conversationId: string | undefined | null
): asserts conversationId is string {
  const result = isValidConversationId(conversationId);
  if (!result.isValid) {
    const error: any = new Error(result.error);
    error.status = 404;
    throw error;
  }
}

export function assertNonEmptyString(
  value: string | undefined | null,
  fieldName: string = 'Value'
): asserts value is string {
  const result = isNonEmptyString(value, fieldName);
  if (!result.isValid) {
    const error: any = new Error(result.error);
    error.status = 400;
    throw error;
  }
}
