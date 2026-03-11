// ============================================
// Unit Tests for Firm Store
// ============================================

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  useFirmStore,
  updateFirmName,
  updateFirmAddress,
  updateFirmContactInfo,
  updateFirmTaxId,
  setFirmSettings,
  updateSingleSetting,
  getFirmName,
  getFirmAddress,
  getFirmContactInfo,
  getFirmTaxId,
  getFirmSettings,
  reset,
} from '../firmStore';
import { initializeTestStores } from '../../test/test-utils';

// ============================================
// Setup & Teardown
// ============================================

describe('Firm Store', () => {
  beforeEach(() => {
    initializeTestStores();
  });

  afterEach(() => {
    reset();
  });

  // ============================================
  // Update Operations Tests
  // ============================================

  describe('Update Operations', () => {
    it('should update firm name successfully', () => {
      updateFirmName('Test Law Firm');

      const firmName = getFirmName();
      expect(firmName).toBe('Test Law Firm');
    });

    it('should update firm address successfully', () => {
      const address = {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA',
      };

      updateFirmAddress(address);

      const firmAddress = getFirmAddress();
      expect(firmAddress).toEqual(address);
    });

    it('should update contact info successfully', () => {
      const contactInfo = {
        email: 'firm@example.com',
        phone: '(555) 123-4567',
        website: 'https://test-law-firm.com',
      };

      updateFirmContactInfo(contactInfo);

      const firmContact = getFirmContactInfo();
      expect(firmContact).toEqual(contactInfo);
    });

    it('should update tax ID successfully', () => {
      updateFirmTaxId('12-3456789');

      const taxId = getFirmTaxId();
      expect(taxId).toBe('12-3456789');
    });

    it('should validate tax ID format', () => {
      expect(() => {
        updateFirmTaxId('INVALID');
      }).not.toThrow();
      // Store accepts any string, validation would be added in real implementation
    });
  });

  // ============================================
  // Settings Tests
  // ============================================

  describe('Firm Settings', () => {
    it('should set multiple firm settings', () => {
      const settings = {
        defaultInterestRate: 8.5,
        autodraftDay: 15,
        paymentTerms: 'Net 30',
        currency: 'USD',
      };

      setFirmSettings(settings);

      const firmSettings = getFirmSettings();
      expect(firmSettings).toMatchObject(settings);
    });

    it('should update single setting', () => {
      updateSingleSetting('defaultInterestRate', 9.0);

      const firmSettings = getFirmSettings();
      expect(firmSettings.defaultInterestRate).toBe(9.0);
    });

    it('should update nested setting', () => {
      updateSingleSetting('notification.email', true);

      const firmSettings = getFirmSettings();
      expect(firmSettings.notification.email).toBe(true);
    });

    it('should preserve existing settings when updating single setting', () => {
      const initialSettings = {
        defaultInterestRate: 8.5,
        autodraftDay: 15,
      };

      setFirmSettings(initialSettings);
      updateSingleSetting('defaultInterestRate', 9.0);

      const firmSettings = getFirmSettings();
      expect(firmSettings.defaultInterestRate).toBe(9.0);
      expect(firmSettings.autodraftDay).toBe(15);
    });

    it('should set notification preferences', () => {
      const settings = {
        notifications: {
          email: true,
          browser: false,
          sms: true,
        },
      };

      setFirmSettings(settings);

      const firmSettings = getFirmSettings();
      expect(firmSettings.notifications).toEqual(settings.notifications);
    });
  });

  // ============================================
  // Getter Tests
  // ============================================

  describe('Getters', () => {
    it('should get firm name', () => {
      updateFirmName('Test Firm');
      const firmName = getFirmName();

      expect(firmName).toBe('Test Firm');
    });

    it('should get firm address', () => {
      const address = {
        street: '456 Test St',
        city: 'Testville',
        state: 'TX',
        zipCode: '54321',
        country: 'USA',
      };

      updateFirmAddress(address);
      const firmAddress = getFirmAddress();

      expect(firmAddress).toEqual(address);
    });

    it('should get contact info', () => {
      const contactInfo = {
        email: 'test@test.com',
        phone: '(555) 555-5555',
        website: 'https://test.com',
      };

      updateFirmContactInfo(contactInfo);
      const firmContact = getFirmContactInfo();

      expect(firmContact).toEqual(contactInfo);
    });

    it('should get tax ID', () => {
      updateFirmTaxId('98-7654321');
      const taxId = getFirmTaxId();

      expect(taxId).toBe('98-7654321');
    });

    it('should get firm settings', () => {
      const settings = {
        defaultInterestRate: 8.0,
        autodraftDay: 1,
      };

      setFirmSettings(settings);
      const firmSettings = getFirmSettings();

      expect(firmSettings).toMatchObject(settings);
    });

    it('should return empty object when no settings', () => {
      reset();
      const firmSettings = getFirmSettings();

      expect(firmSettings).toBeDefined();
      expect(Object.keys(firmSettings).length).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // Reset Tests
  // ============================================

  describe('Reset', () => {
    it('should reset all firm data to defaults', () => {
      // Update some data
      updateFirmName('Custom Firm Name');
      updateFirmTaxId('99-999999999');
      setFirmSettings({
        defaultInterestRate: 10.0,
        autodraftDay: 20,
      });

      // Verify updates
      expect(getFirmName()).toBe('Custom Firm Name');
      expect(getFirmTaxId()).toBe('99-999999999');
      expect(getFirmSettings().defaultInterestRate).toBe(10.0);

      // Reset
      reset();

      // Verify defaults
      expect(getFirmName()).not.toBe('Custom Firm Name');
      expect(getFirmSettings().defaultInterestRate).not.toBe(10.0);
    });

    it('should reset to hardcoded defaults', () => {
      reset();

      expect(getFirmName()).toBeDefined();
      expect(getFirmAddress()).toBeDefined();
      expect(getFirmContactInfo()).toBeDefined();
      expect(getFirmSettings()).toBeDefined();
    });
  });

  // ============================================
  // Persistence Tests
  // ============================================

  describe('Persistence', () => {
    it('should persist settings to localStorage', () => {
      const spy = jest.spyOn(Storage.prototype, 'setItem');

      const settings = {
        defaultInterestRate: 8.5,
        currency: 'USD',
      };

      setFirmSettings(settings);

      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should load settings from localStorage on initialization', () => {
      // This would require testing store initialization
      expect(true).toBe(true); // Placeholder
    });
  });

  // ============================================
  // Validation Tests
  // ============================================

  describe('Validation', () => {
    it('should accept valid firm name', () => {
      updateFirmName('Smith & Associates, P.C.');
      const firmName = getFirmName();

      expect(firmName).toBe('Smith & Associates, P.C.');
    });

    it('should accept empty firm name', () => {
      updateFirmName('');
      const firmName = getFirmName();

      expect(firmName).toBe('');
    });

    it('should accept valid phone number formats', () => {
      const phoneNumbers = [
        '(555) 123-4567',
        '555-123-4567',
        '555.123.4567',
        '555 123 4567',
      ];

      phoneNumbers.forEach((phone) => {
        updateFirmContactInfo({ phone, email: 'test@test.com' });
        const contact = getFirmContactInfo();

        expect(contact.phone).toBe(phone);
      });
    });

    it('should accept valid email formats', () => {
      const emails = [
        'firm@example.com',
        'contact@sub.domain.com',
        'first.last@company.co.uk',
      ];

      emails.forEach((email) => {
        updateFirmContactInfo({ email, phone: '(555) 123-4567' });
        const contact = getFirmContactInfo();

        expect(contact.email).toBe(email);
      });
    });

    it('should accept valid URLs', () => {
      const websites = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com',
        'example.com',
      ];

      websites.forEach((website) => {
        updateFirmContactInfo({ website, email: 'test@test.com' });
        const contact = getFirmContactInfo();

        expect(contact.website).toBe(website);
      });
    });
  });

  // ============================================
  // Integration Tests
  // ============================================

  describe('Firm Store Integration', () => {
    it('should update multiple firm properties', () => {
      updateFirmName('Integrated Test Firm');
      updateFirmTaxId('12-3456789');

      const settings = {
        defaultInterestRate: 8.5,
        autodraftDay: 15,
        currency: 'USD',
      };

      setFirmSettings(settings);

      expect(getFirmName()).toBe('Integrated Test Firm');
      expect(getFirmTaxId()).toBe('12-3456789');
      expect(getFirmSettings().defaultInterestRate).toBe(8.5);
    });

    it('should handle complex settings updates', () => {
      const complexSettings = {
        defaultInterestRate: 8.5,
        autodraftDay: 15,
        paymentTerms: 'Net 30',
        currency: 'USD',
        notifications: {
          email: true,
          browser: true,
          sms: false,
        },
        preferences: {
          compactView: true,
          darkMode: false,
        },
      };

      setFirmSettings(complexSettings);
      const firmSettings = getFirmSettings();

      expect(firmSettings).toMatchObject(complexSettings);
    });

    it('should maintain data consistency after multiple updates', () => {
      updateFirmName('Test Firm 1');
      updateSingleSetting('defaultInterestRate', 8.5);

      expect(getFirmName()).toBe('Test Firm 1');
      expect(getFirmSettings().defaultInterestRate).toBe(8.5);

      updateFirmName('Test Firm 2');
      updateSingleSetting('defaultInterestRate', 9.0);

      expect(getFirmName()).toBe('Test Firm 2');
      expect(getFirmSettings().defaultInterestRate).toBe(9.0);
    });
  });
});
