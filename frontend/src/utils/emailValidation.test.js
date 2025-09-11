import { validateMeaningfulEmail } from './emailValidation';

describe('Frontend Email Validation', () => {
  describe('validateMeaningfulEmail', () => {
    // Valid emails that should pass
    describe('Valid emails', () => {
      test('should accept legitimate personal email', () => {
        const result = validateMeaningfulEmail('john.doe@gmail.com');
        expect(result.isValid).toBe(true);
        expect(result.reason).toBeNull();
      });

      test('should accept business email', () => {
        const result = validateMeaningfulEmail('contact@company.co.uk');
        expect(result.isValid).toBe(true);
        expect(result.reason).toBeNull();
      });

      test('should accept email with numbers in meaningful context', () => {
        const result = validateMeaningfulEmail('user2024@example.com');
        expect(result.isValid).toBe(true);
        expect(result.reason).toBeNull();
      });

      test('should accept email with underscores and dots', () => {
        const result = validateMeaningfulEmail('first_last.name@domain.org');
        expect(result.isValid).toBe(true);
        expect(result.reason).toBeNull();
      });
    });

    // Test specific patterns that should be blocked
    describe('Meaningless patterns to block', () => {
      test('should reject 123@gmail.com', () => {
        const result = validateMeaningfulEmail('123@gmail.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should reject 123@123', () => {
        const result = validateMeaningfulEmail('123@123');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('domain');
      });

      test('should reject test@example.com', () => {
        const result = validateMeaningfulEmail('test@example.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should reject temp@temp.com', () => {
        const result = validateMeaningfulEmail('temp@temp.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should reject fake@fake.com', () => {
        const result = validateMeaningfulEmail('fake@fake.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should reject admin@admin.com', () => {
        const result = validateMeaningfulEmail('admin@admin.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should reject aaa@example.com', () => {
        const result = validateMeaningfulEmail('aaa@example.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should reject qwerty@gmail.com', () => {
        const result = validateMeaningfulEmail('qwerty@gmail.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });
    });

    describe('Numeric patterns', () => {
      test('should reject single digit emails', () => {
        const result = validateMeaningfulEmail('1@test.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('too simple');
      });

      test('should reject two digit emails', () => {
        const result = validateMeaningfulEmail('12@test.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('too simple');
      });

      test('should reject long numeric sequences', () => {
        const result = validateMeaningfulEmail('123456789@gmail.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });
    });

    describe('Disposable email providers', () => {
      test('should reject 10minutemail.com', () => {
        const result = validateMeaningfulEmail('user@10minutemail.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('disposable');
      });

      test('should reject guerrillamail.com', () => {
        const result = validateMeaningfulEmail('test@guerrillamail.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('disposable');
      });

      test('should reject mailinator.com', () => {
        const result = validateMeaningfulEmail('temp@mailinator.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('disposable');
      });

      test('should reject yopmail.com', () => {
        const result = validateMeaningfulEmail('fake@yopmail.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('disposable');
      });
    });

    describe('Suspicious domains', () => {
      test('should reject numeric only domains', () => {
        const emails = ['user@123', 'test@456', 'email@999'];
        emails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('domain');
        });
      });

      test('should reject very short domains', () => {
        const emails = ['user@a', 'test@ab', 'email@x'];
        emails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('domain');
        });
      });

      test('should reject test domains', () => {
        const emails = ['user@test', 'email@fake', 'person@dummy'];
        emails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('domain');
        });
      });
    });

    describe('Edge cases', () => {
      test('should handle empty email', () => {
        const result = validateMeaningfulEmail('');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('required');
      });

      test('should handle null email', () => {
        const result = validateMeaningfulEmail(null);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('required');
      });

      test('should handle undefined email', () => {
        const result = validateMeaningfulEmail(undefined);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('required');
      });

      test('should handle malformed emails', () => {
        const malformedEmails = [
          'notanemail',
          '@domain.com',
          'user@',
          'user.domain.com',
          'user@domain'
        ];

        malformedEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('format');
        });
      });

      test('should handle case insensitivity', () => {
        const result = validateMeaningfulEmail('TEST@EXAMPLE.COM');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should handle whitespace trimming', () => {
        const result = validateMeaningfulEmail('  test@example.com  ');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });
    });

    describe('Boundary cases for meaningful emails', () => {
      test('should accept emails with meaningful numbers', () => {
        const meaningfulEmails = [
          'john.doe2024@company.com',
          'client.v2@business.org',
          'support.team1@service.net'
        ];

        meaningfulEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.reason).toBeNull();
        });
      });

      test('should accept longer meaningful local parts', () => {
        const meaningfulEmails = [
          'first.last@domain.com',
          'john.smith.jr@company.org',
          'customer.service@business.net'
        ];

        meaningfulEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.reason).toBeNull();
        });
      });

      test('should accept international domains', () => {
        const internationalEmails = [
          'user@domain.co.uk',
          'contact@business.com.au',
          'info@company.de'
        ];

        internationalEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(true);
          expect(result.reason).toBeNull();
        });
      });
    });
  });
});