import { 
  validateEmail, 
  validatePassword, 
  validatePhone, 
  validateAmount,
  validateRequired,
  validateMinLength,
  validateMaxLength
} from '../validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    test('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    test('rejects invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    test('handles edge cases', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
      expect(validateEmail(123 as any)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('validates strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MySecureP@ssw0rd')).toBe(true);
      expect(validatePassword('Complex123#Password')).toBe(true);
    });

    test('rejects weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });

    test('validates minimum requirements', () => {
      // Should have at least 8 characters, 1 uppercase, 1 lowercase, 1 number
      expect(validatePassword('Abc123!')).toBe(true);
      expect(validatePassword('Password1')).toBe(true);
    });
  });

  describe('validatePhone', () => {
    test('validates Indian phone numbers', () => {
      expect(validatePhone('9876543210')).toBe(true);
      expect(validatePhone('+919876543210')).toBe(true);
      expect(validatePhone('919876543210')).toBe(true);
    });

    test('rejects invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('987654321')).toBe(false); // 9 digits
      expect(validatePhone('98765432101')).toBe(false); // 11 digits
      expect(validatePhone('')).toBe(false);
    });

    test('handles edge cases', () => {
      expect(validatePhone(null as any)).toBe(false);
      expect(validatePhone(undefined as any)).toBe(false);
      expect(validatePhone('abc123def')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    test('validates positive amounts', () => {
      expect(validateAmount(1000)).toBe(true);
      expect(validateAmount(50000)).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
    });

    test('rejects invalid amounts', () => {
      expect(validateAmount(-1000)).toBe(false);
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(NaN)).toBe(false);
    });

    test('handles edge cases', () => {
      expect(validateAmount(null as any)).toBe(false);
      expect(validateAmount(undefined as any)).toBe(false);
      expect(validateAmount('invalid' as any)).toBe(false);
    });
  });

  describe('validateRequired', () => {
    test('validates required fields', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired(0)).toBe(true);
      expect(validateRequired(false)).toBe(true);
    });

    test('rejects empty values', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
      expect(validateRequired([])).toBe(false);
    });
  });

  describe('validateMinLength', () => {
    test('validates minimum length', () => {
      expect(validateMinLength('test', 3)).toBe(true);
      expect(validateMinLength('testing', 5)).toBe(true);
      expect(validateMinLength('', 0)).toBe(true);
    });

    test('rejects strings below minimum length', () => {
      expect(validateMinLength('ab', 3)).toBe(false);
      expect(validateMinLength('', 1)).toBe(false);
    });

    test('handles edge cases', () => {
      expect(validateMinLength(null as any, 3)).toBe(false);
      expect(validateMinLength(undefined as any, 3)).toBe(false);
    });
  });

  describe('validateMaxLength', () => {
    test('validates maximum length', () => {
      expect(validateMaxLength('test', 5)).toBe(true);
      expect(validateMaxLength('', 10)).toBe(true);
      expect(validateMaxLength('abc', 3)).toBe(true);
    });

    test('rejects strings above maximum length', () => {
      expect(validateMaxLength('testing', 5)).toBe(false);
      expect(validateMaxLength('very long string', 10)).toBe(false);
    });

    test('handles edge cases', () => {
      expect(validateMaxLength(null as any, 5)).toBe(false);
      expect(validateMaxLength(undefined as any, 5)).toBe(false);
    });
  });
});
