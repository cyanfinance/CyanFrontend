import { formatCurrency, formatDate, formatNumber, formatPercentage } from '../formatters';

describe('Formatters', () => {
  describe('formatCurrency', () => {
    test('formats positive numbers correctly', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(50000)).toBe('₹50,000.00');
      expect(formatCurrency(1234567)).toBe('₹12,34,567.00');
    });

    test('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    test('formats decimal numbers correctly', () => {
      expect(formatCurrency(1000.5)).toBe('₹1,000.50');
      expect(formatCurrency(1000.99)).toBe('₹1,000.99');
    });

    test('handles negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-₹1,000.00');
    });

    test('handles undefined and null', () => {
      expect(formatCurrency(undefined as any)).toBe('₹0.00');
      expect(formatCurrency(null as any)).toBe('₹0.00');
    });
  });

  describe('formatDate', () => {
    test('formats date correctly', () => {
      const date = new Date('2025-08-26');
      expect(formatDate(date)).toBe('26/08/2025');
    });

    test('formats date with custom format', () => {
      const date = new Date('2025-08-26');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2025-08-26');
    });

    test('handles invalid date', () => {
      expect(formatDate('invalid' as any)).toBe('Invalid Date');
    });

    test('handles null and undefined', () => {
      expect(formatDate(null as any)).toBe('Invalid Date');
      expect(formatDate(undefined as any)).toBe('Invalid Date');
    });
  });

  describe('formatNumber', () => {
    test('formats numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(50000)).toBe('50,000');
      expect(formatNumber(1234567)).toBe('12,34,567');
    });

    test('formats decimal numbers', () => {
      expect(formatNumber(1000.5)).toBe('1,000.5');
      expect(formatNumber(1000.99)).toBe('1,000.99');
    });

    test('handles zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    test('handles negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
    });
  });

  describe('formatPercentage', () => {
    test('formats percentages correctly', () => {
      expect(formatPercentage(0.12)).toBe('12%');
      expect(formatPercentage(0.125)).toBe('12.5%');
      expect(formatPercentage(1)).toBe('100%');
    });

    test('formats with custom decimal places', () => {
      expect(formatPercentage(0.1234, 2)).toBe('12.34%');
    });

    test('handles zero', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    test('handles negative percentages', () => {
      expect(formatPercentage(-0.12)).toBe('-12%');
    });
  });
});
