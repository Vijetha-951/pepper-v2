// validation/authSchemas.js - Zod schemas and middleware
const { z } = require('zod');

const registerSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 chars')
    .regex(/^[\p{L}][\p{L}' -]*$/u, "Use letters, spaces, hyphens, or apostrophes only"),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 chars')
    .regex(/^[\p{L}][\p{L}' -]*$/u, "Use letters, spaces, hyphens, or apostrophes only"),
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(8, 'Min 8 chars')
    .regex(/[A-Z]/, 'At least one uppercase')
    .regex(/[a-z]/, 'At least one lowercase')
    .regex(/\d/, 'At least one number')
    .regex(/[^A-Za-z0-9]/, 'At least one special character'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  place: z.string().min(2),
  district: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  role: z.enum(['user', 'admin']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password is required')
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, errors: result.error.flatten() });
  }
  req.validated = result.data;
  next();
};

module.exports = { registerSchema, loginSchema, validate }; 