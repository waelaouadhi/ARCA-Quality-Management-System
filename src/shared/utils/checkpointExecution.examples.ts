/**
 * Checkpoint-Based Execution Examples
 * 
 * Demonstrates checkpoint-based workflows with failure recovery,
 * idempotency, and transaction management for document lifecycle operations.
 */

import {
  CheckpointManager,
  IdempotencyManager,
  WorkflowExecutor,
  Task,
  RecoveryManager,
  TransactionManager,
} from '@/shared/utils/checkpointExecution';

// ============================================================================
// Example 1: Document Approval Workflow with Checkpoints
// ============================================================================

export async function documentApprovalWorkflow() {
  console.log('\n=== Document Approval Workflow with Checkpoints ===\n');

  const workflowId = 'doc-approve-001';
  const documentId = 'doc-123';

  // Define workflow tasks
  const tasks: Task[] = [
    {
      id: 'validate-doc',
      name: 'Validate Document',
      execute: async () => {
        console.log('  📋 Validating document structure...');
        // Simulate validation
        await new Promise(r => setTimeout(r, 100));
        return { status: 'valid', checksPerformed: 5 };
      },
    },
    {
      id: 'check-reviewers',
      name: 'Check Reviewer Availability',
      execute: async () => {
        console.log('  👥 Checking reviewer assignments...');
        await new Promise(r => setTimeout(r, 100));
        return { reviewersAvailable: true, count: 3 };
      },
    },
    {
      id: 'notify-reviewers',
      name: 'Notify Reviewers',
      execute: async () => {
        const key = IdempotencyManager.generateKey('notify-reviewers', { documentId });
        
        return IdempotencyManager.executeIdempotent(key, async () => {
          console.log('  📧 Sending review notifications...');
          await new Promise(r => setTimeout(r, 100));
          return { notificationsSent: 3 };
        });
      },
    },
    {
      id: 'create-version',
      name: 'Create Document Version',
      execute: async () => {
        console.log('  📌 Creating versioned snapshot...');
        await new Promise(r => setTimeout(r, 100));
        return { versionId: 'v1.0', timestamp: new Date().toISOString() };
      },
    },
    {
      id: 'update-status',
      name: 'Update Document Status',
      execute: async () => {
        console.log('  ✓ Updating document status to REVIEW...');
        await new Promise(r => setTimeout(r, 100));
        return { newStatus: 'REVIEW' };
      },
    },
  ];

  // Execute workflow
  const result = await WorkflowExecutor.executeWorkflow(
    workflowId,
    tasks,
    { documentId, initiator: 'user-123' }
  );

  if (result) {
    console.log(`\n✅ Workflow completed successfully`);
    console.log(`Progress: ${CheckpointManager.getProgress(workflowId)}`);
  }
}

// ============================================================================
// Example 2: Workflow with Failure and Recovery
// ============================================================================

export async function failureAndRecoveryDemo() {
  console.log('\n=== Workflow with Failure and Recovery ===\n');

  const workflowId = 'doc-approve-recovery';
  const documentId = 'doc-456';

  let attemptCount = 0;

  const tasks: Task[] = [
    {
      id: 'step-1',
      name: 'Step 1: Validation',
      execute: async () => {
        console.log('  ✓ Validation passed');
        return { validated: true };
      },
    },
    {
      id: 'step-2-failing',
      name: 'Step 2: External API Call (May Fail)',
      execute: async () => {
        attemptCount++;
        console.log(`  ⚠️ Attempting API call (attempt ${attemptCount})...`);

        if (attemptCount < 2) {
          throw new Error('Connection timeout');
        }

        console.log('  ✓ API call succeeded');
        return { apiResponse: 'success' };
      },
      maxRetries: 2,
    },
    {
      id: 'step-3',
      name: 'Step 3: Process Result',
      execute: async () => {
        console.log('  ✓ Processing result');
        return { processed: true };
      },
    },
  ];

  // First execution (will fail)
  console.log('🚀 First execution attempt...');
  let result = await WorkflowExecutor.executeWorkflow(
    workflowId,
    tasks,
    { documentId }
  );

  if (!result) {
    console.log('\n⚠️ Workflow paused due to failure');

    // Wait a moment
    await new Promise(r => setTimeout(r, 500));

    // Resume workflow
    console.log('\n🔄 Resuming workflow...');
    result = await WorkflowExecutor.resumeWorkflow(workflowId, tasks);
  }

  if (result && result.status === 'COMPLETED') {
    console.log(`\n✅ Workflow recovered and completed`);
  }
}

// ============================================================================
// Example 3: Idempotent Operations
// ============================================================================

export async function idempotentOperationsDemo() {
  console.log('\n=== Idempotent Operations Demo ===\n');

  const operationKey = 'approve-document:doc-789';

  console.log('📋 First execution of idempotent operation...');
  const result1 = await IdempotencyManager.executeIdempotent(
    operationKey,
    async () => {
      console.log('   Executing approval logic...');
      await new Promise(r => setTimeout(r, 100));
      return { approved: true, timestamp: Date.now() };
    }
  );

  console.log('✅ First execution result:', result1);

  // Wait a moment
  await new Promise(r => setTimeout(r, 100));

  console.log('\n📋 Second execution of same operation (should return cached)...');
  const result2 = await IdempotencyManager.executeIdempotent(
    operationKey,
    async () => {
      console.log('   Executing approval logic... (THIS SHOULD NOT APPEAR)');
      await new Promise(r => setTimeout(r, 100));
      return { approved: true, timestamp: Date.now() };
    }
  );

  console.log('✅ Second execution result:', result2);
  console.log(`   Same result: ${result1 === result2 ? 'YES ✓' : 'NO ✗'}`);
}

// ============================================================================
// Example 4: Multi-Stage Document Workflow
// ============================================================================

export async function multiStageDocumentWorkflow() {
  console.log('\n=== Multi-Stage Document Workflow ===\n');

  const workflowId = 'doc-complete-workflow';
  const documentId = 'doc-999';
  const transactionManager = new TransactionManager();

  const tasks: Task[] = [
    {
      id: 'stage-1-create',
      name: 'Stage 1: Create Document',
      execute: async () => {
        const tx = transactionManager.beginTransaction(workflowId);
        
        console.log('  ✓ Creating document record');
        transactionManager.addOperation(tx.id, 'CHECKPOINT', {
          stage: 'create',
          documentId,
        });

        await transactionManager.commitTransaction(tx.id);
        return { documentCreated: true };
      },
    },
    {
      id: 'stage-2-assign-reviewers',
      name: 'Stage 2: Assign Reviewers',
      execute: async () => {
        console.log('  ✓ Assigning 3 reviewers');
        await new Promise(r => setTimeout(r, 50));
        return { reviewersAssigned: 3 };
      },
    },
    {
      id: 'stage-3-submit-review',
      name: 'Stage 3: Submit for Review',
      execute: async () => {
        const key = IdempotencyManager.generateKey('submit-review', { documentId });
        
        return IdempotencyManager.executeIdempotent(key, async () => {
          console.log('  ✓ Submitting document for review');
          await new Promise(r => setTimeout(r, 50));
          return { submittedAt: new Date().toISOString() };
        });
      },
    },
    {
      id: 'stage-4-wait-approval',
      name: 'Stage 4: Wait for Approval',
      execute: async () => {
        console.log('  ✓ Document status: REVIEW');
        await new Promise(r => setTimeout(r, 50));
        return { waitingForApproval: true };
      },
    },
    {
      id: 'stage-5-publish',
      name: 'Stage 5: Publish Document',
      execute: async () => {
        const key = IdempotencyManager.generateKey('publish', { documentId });
        
        return IdempotencyManager.executeIdempotent(key, async () => {
          console.log('  ✓ Publishing document');
          await new Promise(r => setTimeout(r, 50));
          return { publishedAt: new Date().toISOString() };
        });
      },
    },
  ];

  const result = await WorkflowExecutor.executeWorkflow(workflowId, tasks);

  if (result) {
    const progress = CheckpointManager.getProgress(workflowId);
    console.log(`\n✅ Workflow completed: ${progress?.percentage}% done`);
  }
}

// ============================================================================
// Example 5: Retry with Exponential Backoff
// ============================================================================

export async function retryDemo() {
  console.log('\n=== Retry with Exponential Backoff ===\n');

  let attempts = 0;

  try {
    const result = await RecoveryManager.retryWithBackoff(
      async () => {
        attempts++;
        console.log(`  Attempt ${attempts}...`);

        if (attempts < 3) {
          throw new Error('ECONNREFUSED: Connection refused');
        }

        return { success: true, attempts };
      },
      3,
      200 // 200ms base delay
    );

    console.log(`\n✅ Operation succeeded after ${result.attempts} attempts`);
  } catch (error) {
    console.log(`\n❌ Operation failed: ${error}`);
  }
}

// ============================================================================
// Example 6: Document Versioning with Checkpoints
// ============================================================================

export async function documentVersioningWorkflow() {
  console.log('\n=== Document Versioning Workflow ===\n');

  const workflowId = 'doc-versioning';
  const baseDocId = 'doc-v1';

  const tasks: Task[] = [
    {
      id: 'v1-create',
      name: 'Version 1: Create Initial',
      execute: async () => {
        console.log('  ✓ Creating version 1.0');
        return { version: '1.0', status: 'APPROVED' };
      },
    },
    {
      id: 'v2-prepare',
      name: 'Version 2: Prepare Revision',
      execute: async () => {
        console.log('  ✓ Creating version 2.0 (DRAFT)');
        return { version: '2.0', status: 'DRAFT', basedOn: '1.0' };
      },
    },
    {
      id: 'v2-review',
      name: 'Version 2: Submit for Review',
      execute: async () => {
        const key = IdempotencyManager.generateKey('submit-version', { version: '2.0' });
        
        return IdempotencyManager.executeIdempotent(key, async () => {
          console.log('  ✓ Version 2.0 submitted for review');
          return { version: '2.0', status: 'REVIEW' };
        });
      },
    },
    {
      id: 'v2-approve',
      name: 'Version 2: Approve',
      execute: async () => {
        console.log('  ✓ Version 2.0 approved');
        return { version: '2.0', status: 'APPROVED' };
      },
    },
    {
      id: 'v1-archive',
      name: 'Version 1: Archive Previous',
      execute: async () => {
        console.log('  ✓ Archiving version 1.0');
        return { version: '1.0', status: 'ARCHIVED' };
      },
    },
  ];

  const result = await WorkflowExecutor.executeWorkflow(
    workflowId,
    tasks,
    { baseDocId }
  );

  if (result) {
    console.log('\n✅ Versioning workflow completed');
  }
}

// ============================================================================
// Example 7: Compliance Audit Trail
// ============================================================================

export async function complianceAuditTrail() {
  console.log('\n=== Compliance Audit Trail ===\n');

  const workflowId = 'compliance-audit-001';

  const tasks: Task[] = [
    {
      id: 'pre-audit-check',
      name: 'Pre-Audit Validation',
      execute: async () => {
        console.log('  ✓ Checking document compliance status');
        return { compliant: true, checksPerformed: 10 };
      },
    },
    {
      id: 'signature-verification',
      name: 'Verify Digital Signatures',
      execute: async () => {
        console.log('  ✓ Verifying 3 digital signatures');
        return { signaturesVerified: 3 };
      },
    },
    {
      id: 'retention-check',
      name: 'Check Retention Policy',
      execute: async () => {
        const key = IdempotencyManager.generateKey('retention-check', {
          workflowId,
        });
        
        return IdempotencyManager.executeIdempotent(key, async () => {
          console.log('  ✓ Verifying retention requirements');
          return { retentionValid: true, until: '2026-04-07' };
        });
      },
    },
    {
      id: 'generate-report',
      name: 'Generate Audit Report',
      execute: async () => {
        console.log('  ✓ Generating compliance report');
        return { reportId: 'audit-2024-001', generated: new Date().toISOString() };
      },
    },
  ];

  const result = await WorkflowExecutor.executeWorkflow(workflowId, tasks);

  if (result) {
    console.log('\n✅ Compliance audit completed');
    console.log(`   Checkpoints: ${result.currentCheckpoint}/${result.totalCheckpoints}`);
  }
}

// ============================================================================
// Run All Examples
// ============================================================================

export async function runAllExamples() {
  try {
    await documentApprovalWorkflow();
    await new Promise(r => setTimeout(r, 500));

    await failureAndRecoveryDemo();
    await new Promise(r => setTimeout(r, 500));

    await idempotentOperationsDemo();
    await new Promise(r => setTimeout(r, 500));

    await multiStageDocumentWorkflow();
    await new Promise(r => setTimeout(r, 500));

    await retryDemo();
    await new Promise(r => setTimeout(r, 500));

    await documentVersioningWorkflow();
    await new Promise(r => setTimeout(r, 500));

    await complianceAuditTrail();

    console.log('\n\n=== All Examples Completed ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
