/**
 * Email validation middleware to block meaningless or suspicious email addresses
 */

// List of common meaningless patterns and domains
const MEANINGLESS_PATTERNS = [
  // Numeric patterns
  /^\d+@/,                          // Starting with only numbers
  /^123+@/,                         // Starting with 123...
  /^test\d*@/i,                     // test, test1, test123, etc.
  /^temp\d*@/i,                     // temp, temp1, temp123, etc.
  /^dummy\d*@/i,                    // dummy, dummy1, dummy123, etc.
  /^fake\d*@/i,                     // fake, fake1, fake123, etc.
  /^spam\d*@/i,                     // spam, spam1, spam123, etc.
  /^noreply\d*@/i,                  // noreply, noreply1, etc.
  /^admin\d*@/i,                    // admin, admin1, admin123, etc.
  /^root\d*@/i,                     // root, root1, root123, etc.
  /^user\d*@/i,                     // user, user1, user123, etc.
  /^email\d*@/i,                    // email, email1, email123, etc.
  /^sample\d*@/i,                   // sample, sample1, sample123, etc.
  /^example\d*@/i,                  // example, example1, example123, etc.
  
  // Keyboard patterns
  /^qwerty\d*@/i,                   // qwerty, qwerty123, etc.
  /^asdf\d*@/i,                     // asdf, asdf123, etc.
  /^[a-z]{1,3}\d*@/,               // Very short letter combinations with numbers
  
  // Common meaningless combinations
  /^(abc|xyz|aaa|bbb|ccc)\d*@/i,    // abc123, xyz456, aaa111, etc.
  /^[a-z]\1{2,}@/i,                 // aaa@, bbb@, ccc@, etc. (repeated letters)
  /^.*[a-z]\1{3,}.*@/i,             // Contains 4+ repeated letters
];

// Suspicious domains (incomplete or obviously fake)
const SUSPICIOUS_DOMAINS = [
  /^123$/,                          // Just numbers as domain
  /^\d+$/,                          // Only digits as domain
  /^[a-z]{1,3}$/,                   // Very short domain names (a, ab, abc)
  /^(test|temp|fake|dummy|spam)$/i, // Common test domains
  /^localhost$/i,                   // localhost
  /^example$/i,                     // example
  /^sample$/i,                      // sample
  /^invalid$/i,                     // invalid
];

// Common disposable/temporary email providers (basic list)
const DISPOSABLE_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'yopmail.com',
  'throwaway.email',
  'temp-mail.org',
  'getairmail.com',
  'maildrop.cc',
  'sharklasers.com'
];

/**
 * Validate if an email address is meaningful and not suspicious
 * @param {string} email - Email address to validate
 * @returns {Object} - Validation result
 */
export function validateMeaningfulEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      reason: 'Email is required'
    };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      reason: 'Invalid email format'
    };
  }

  const [localPart, domainPart] = trimmedEmail.split('@');
  const [domain, ...tldParts] = domainPart.split('.');
  const tld = tldParts.join('.');

  // Check for meaningless local part patterns
  for (const pattern of MEANINGLESS_PATTERNS) {
    if (pattern.test(localPart)) {
      return {
        isValid: false,
        reason: 'Email address appears to be meaningless or temporary. Please use a valid personal email address.'
      };
    }
  }

  // Check for suspicious domains using the full domain (e.g., example.com),
  // not just the first label, to avoid false positives like abc.com or xyz.in
  for (const pattern of SUSPICIOUS_DOMAINS) {
    if (pattern.test(domainPart)) {
      return {
        isValid: false,
        reason: 'Please use a valid email domain.'
      };
    }
  }

  // Check for disposable email domains
  if (DISPOSABLE_DOMAINS.includes(domainPart)) {
    return {
      isValid: false,
      reason: 'Temporary or disposable email addresses are not allowed. Please use a permanent email address.'
    };
  }

  // Additional checks for very short local parts with no meaningful content
  if (localPart.length < 3 && /^\d+$/.test(localPart)) {
    return {
      isValid: false,
      reason: 'Email address appears to be too simple. Please use a more descriptive email address.'
    };
  }

  // Check for extremely repetitive patterns
  if (localPart.length > 2 && /^(.)\1*$/.test(localPart)) {
    return {
      isValid: false,
      reason: 'Email address appears to be meaningless. Please use a valid personal email address.'
    };
  }

  return {
    isValid: true,
    reason: null
  };
}

/**
 * Express middleware to validate meaningful emails
 */
export function validateMeaningfulEmailMiddleware(req, res, next) {
  const email = req.body?.email;
  
  if (!email) {
    return next(); // Let other validation handle required field validation
  }

  const validation = validateMeaningfulEmail(email);
  
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: validation.reason,
      field: 'email'
    });
  }

  next();
}

export default {
  validateMeaningfulEmail,
  validateMeaningfulEmailMiddleware
};