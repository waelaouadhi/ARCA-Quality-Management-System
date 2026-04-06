import {
  RegisterSchema,
  LoginSchema,
  UpdateUserSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
  CreateNonConformanceSchema,
  UpdateNonConformanceSchema,
  CreateCorrectiveActionSchema,
  UpdateCorrectiveActionSchema,
} from '@/shared/validation/schemas';

describe('Validation Schemas', () => {
  describe('RegisterSchema', () => {
    it('accepts valid registration input', () => {
      const result = RegisterSchema.safeParse({
        email: 'john@qms.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = RegisterSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const result = RegisterSchema.safeParse({
        email: 'john@qms.com',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty first name', () => {
      const result = RegisterSchema.safeParse({
        email: 'john@qms.com',
        password: 'password123',
        firstName: '',
        lastName: 'Doe',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateDocumentSchema', () => {
    it('accepts valid document input', () => {
      const result = CreateDocumentSchema.safeParse({ title: 'SOP-001', content: 'Procedure content' });
      expect(result.success).toBe(true);
    });

    it('accepts document without content', () => {
      const result = CreateDocumentSchema.safeParse({ title: 'SOP-001' });
      expect(result.success).toBe(true);
    });

    it('rejects title shorter than 3 characters', () => {
      const result = CreateDocumentSchema.safeParse({ title: 'AB' });
      expect(result.success).toBe(false);
    });

    it('rejects title longer than 200 characters', () => {
      const result = CreateDocumentSchema.safeParse({ title: 'A'.repeat(201) });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateNonConformanceSchema', () => {
    it('accepts valid non-conformance input', () => {
      const result = CreateNonConformanceSchema.safeParse({
        title: 'Label Mismatch',
        description: 'Batch has incorrect expiration date on labels',
        severity: 'HIGH',
      });
      expect(result.success).toBe(true);
    });

    it('accepts non-conformance without severity (uses default)', () => {
      const result = CreateNonConformanceSchema.safeParse({
        title: 'Label Mismatch',
        description: 'Batch has incorrect expiration date on labels',
      });
      expect(result.success).toBe(true);
    });

    it('rejects description shorter than 10 characters', () => {
      const result = CreateNonConformanceSchema.safeParse({
        title: 'Label Mismatch',
        description: 'Short',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid severity value', () => {
      const result = CreateNonConformanceSchema.safeParse({
        title: 'Label Mismatch',
        description: 'Batch has incorrect expiration date on labels',
        severity: 'EXTREME',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateCorrectiveActionSchema', () => {
    it('accepts valid corrective action input', () => {
      const result = CreateCorrectiveActionSchema.safeParse({
        action: 'Update labeling SOP and retrain all staff',
        nonConformanceId: 'nc-001',
      });
      expect(result.success).toBe(true);
    });

    it('accepts corrective action with all optional fields', () => {
      const result = CreateCorrectiveActionSchema.safeParse({
        action: 'Update labeling SOP and retrain all staff',
        nonConformanceId: 'nc-001',
        assignedToId: 'user-001',
        dueDate: '2026-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('rejects action description shorter than 10 characters', () => {
      const result = CreateCorrectiveActionSchema.safeParse({
        action: 'Fix it',
        nonConformanceId: 'nc-001',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = CreateCorrectiveActionSchema.safeParse({
        action: 'Update labeling SOP and retrain all staff',
        nonConformanceId: 'nc-001',
        dueDate: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateDocumentSchema', () => {
    it('accepts partial update', () => {
      const result = UpdateDocumentSchema.safeParse({ status: 'APPROVED' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status value', () => {
      const result = UpdateDocumentSchema.safeParse({ status: 'INVALID' });
      expect(result.success).toBe(false);
    });
  });
});
