import { validateMeaningfulEmail, validateMeaningfulEmailMiddleware } from './emailValidation.js';

describe('Email Validation Utility', () => {
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

    // Meaningless patterns that should be blocked
    describe('Meaningless numeric patterns', () => {
      test('should reject purely numeric local part', () => {
        const result = validateMeaningfulEmail('123@gmail.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should reject 123 pattern', () => {
        const result = validateMeaningfulEmail('12345@yahoo.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should reject very short numeric patterns', () => {
        const result = validateMeaningfulEmail('1@example.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('too simple');
      });

      test('should reject two digit numbers', () => {
        const result = validateMeaningfulEmail('12@test.com');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('too simple');
      });
    });

    describe('Test/temporary patterns', () => {
      test('should reject test email patterns', () => {
        const testEmails = [
          'test@example.com',
          'test123@gmail.com',
          'temp@yahoo.com',
          'dummy@hotmail.com',
          'fake@test.org',
          'spam123@provider.com'
        ];

        testEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('meaningless');
        });
      });

      test('should reject admin/system patterns', () => {
        const systemEmails = [
          'admin@example.com',
          'root@test.com',
          'user@domain.com',
          'noreply@site.org'
        ];

        systemEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('meaningless');
        });
      });
    });

    describe('Keyboard and repetitive patterns', () => {
      test('should reject keyboard patterns', () => {
        const keyboardEmails = [
          'qwerty@gmail.com',
          'asdf@yahoo.com',
          'qwerty123@test.com'
        ];

        keyboardEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('meaningless');
        });
      });

      test('should reject repeated character patterns', () => {
        const repetitiveEmails = [
          'aaa@example.com',
          'bbb@test.com',
          'aaaa@domain.org',
          'xxxxx@site.com'
        ];

        repetitiveEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('meaningless');
        });
      });
    });

    describe('Suspicious domains', () => {
      test('should reject numeric-only domains', () => {
        const numericDomains = [
          'user@123',
          'test@456.789',
          'email@999'
        ];

        numericDomains.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('domain');
        });
      });

      test('should reject very short domains', () => {
        const shortDomains = [
          'user@a',
          'test@ab',
          'email@x.y'
        ];

        shortDomains.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('domain');
        });
      });

      test('should reject test domains', () => {
        const testDomains = [
          'user@test',
          'email@fake',
          'person@dummy',
          'contact@example'
        ];

        testDomains.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('domain');
        });
      });
    });

    describe('Disposable email providers', () => {
      test('should reject common disposable email providers', () => {
        const disposableEmails = [
          'user@10minutemail.com',
          'test@guerrillamail.com',
          'temp@mailinator.com',
          'fake@yopmail.com'
        ];

        disposableEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('disposable');
        });
      });
    });

    describe('Basic validation', () => {
      test('should reject empty email', () => {
        const result = validateMeaningfulEmail('');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('required');
      });

      test('should reject null email', () => {
        const result = validateMeaningfulEmail(null);
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('required');
      });

      test('should reject invalid email format', () => {
        const invalidEmails = [
          'notanemail',
          '@domain.com',
          'user@',
          'user.domain.com',
          'user@domain'
        ];

        invalidEmails.forEach(email => {
          const result = validateMeaningfulEmail(email);
          expect(result.isValid).toBe(false);
          expect(result.reason).toContain('format');
        });
      });
    });

    describe('Edge cases', () => {
      test('should handle case insensitivity', () => {
        const result = validateMeaningfulEmail('TEST@EXAMPLE.COM');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should trim whitespace', () => {
        const result = validateMeaningfulEmail('  test@example.com  ');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('meaningless');
      });

      test('should handle mixed case disposable domains', () => {
        const result = validateMeaningfulEmail('user@GUERRILLAMAIL.COM');
        expect(result.isValid).toBe(false);
        expect(result.reason).toContain('disposable');
      });
    });
  });

  describe('validateMeaningfulEmailMiddleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {}
      };
      res = {
        status: jest.fn(() => res),
        json: jest.fn(() => res)
      };
      next = jest.fn();
    });

    test('should call next() when no email is provided', () => {
      validateMeaningfulEmailMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should call next() for valid email', () => {
      req.body.email = 'john.doe@gmail.com';
      validateMeaningfulEmailMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return 400 error for meaningless email', () => {
      req.body.email = '123@gmail.com';
      validateMeaningfulEmailMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('meaningless'),
        field: 'email'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 400 error for disposable email', () => {
      req.body.email = 'user@10minutemail.com';
      validateMeaningfulEmailMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('disposable'),
        field: 'email'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 400 error for test email patterns', () => {
      req.body.email = 'test@example.com';
      validateMeaningfulEmailMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('meaningless'),
        field: 'email'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});