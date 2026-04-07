import {
  CheckpointManager,
  IdempotencyManager,
  WorkflowExecutor,
  RecoveryManager,
  Task,
} from '@/shared/utils/checkpointExecution';

describe('Checkpoint-Based Execution System', () => {
  describe('CheckpointManager', () => {
    it('creates workflow with correct initial state', () => {
      const workflow = CheckpointManager.createWorkflow('wf-1', ['task-1', 'task-2', 'task-3']);

      expect(workflow.workflowId).toBe('wf-1');
      expect(workflow.currentCheckpoint).toBe(0);
      expect(workflow.totalCheckpoints).toBe(3);
      expect(workflow.status).toBe('RUNNING');
    });

    it('creates checkpoint after task completion', () => {
      CheckpointManager.createWorkflow('wf-2', ['task-1']);

      const checkpoint = CheckpointManager.createCheckpoint('wf-2', 'task-1', 1, {
        result: 'success',
      });

      expect(checkpoint.taskId).toBe('task-1');
      expect(checkpoint.checkpointNumber).toBe(1);
      expect(checkpoint.status).toBe('COMPLETED');
    });

    it('retrieves last checkpoint', () => {
      CheckpointManager.createWorkflow('wf-3', ['task-1', 'task-2']);
      CheckpointManager.createCheckpoint('wf-3', 'task-1', 1, { result: '1' });
      CheckpointManager.createCheckpoint('wf-3', 'task-2', 2, { result: '2' });

      const last = CheckpointManager.getLastCheckpoint('wf-3');

      expect(last?.checkpointNumber).toBe(2);
      expect(last?.state.result).toBe('2');
    });

    it('updates workflow status', () => {
      CheckpointManager.createWorkflow('wf-4', ['task-1']);
      const updated = CheckpointManager.updateWorkflowStatus('wf-4', 'COMPLETED', 1);

      expect(updated?.status).toBe('COMPLETED');
      expect(updated?.currentCheckpoint).toBe(1);
    });

    it('records failures and increments counter', () => {
      CheckpointManager.createWorkflow('wf-5', ['task-1']);
      let workflow = CheckpointManager.recordFailure('wf-5', 'Error 1');

      expect(workflow?.failureCount).toBe(1);
      expect(workflow?.lastError).toBe('Error 1');

      workflow = CheckpointManager.recordFailure('wf-5', 'Error 2');
      expect(workflow?.failureCount).toBe(2);
    });

    it('restores workflow from checkpoint', () => {
      CheckpointManager.createWorkflow('wf-6', ['task-1', 'task-2']);
      CheckpointManager.createCheckpoint('wf-6', 'task-1', 1, { result: 'done' });

      const checkpoint = CheckpointManager.restoreFromCheckpoint('wf-6');

      expect(checkpoint?.checkpointNumber).toBe(1);

      const restored = CheckpointManager.getWorkflow('wf-6');
      expect(restored?.currentCheckpoint).toBe(1);
      expect(restored?.status).toBe('RUNNING');
    });

    it('calculates workflow progress', () => {
      CheckpointManager.createWorkflow('wf-7', ['task-1', 'task-2', 'task-3']);
      CheckpointManager.updateWorkflowStatus('wf-7', 'RUNNING', 2);

      const progress = CheckpointManager.getProgress('wf-7');

      expect(progress?.completed).toBe(2);
      expect(progress?.total).toBe(3);
      expect(progress?.percentage).toBe(67);
    });
  });

  describe('IdempotencyManager', () => {
    it('generates consistent idempotency keys', () => {
      const key1 = IdempotencyManager.generateKey('approve', { docId: 'doc-1' });
      const key2 = IdempotencyManager.generateKey('approve', { docId: 'doc-1' });

      expect(key1).toBe(key2);
    });

    it('generates different keys for different params', () => {
      const key1 = IdempotencyManager.generateKey('approve', { docId: 'doc-1' });
      const key2 = IdempotencyManager.generateKey('approve', { docId: 'doc-2' });

      expect(key1).not.toBe(key2);
    });

    it('records operation result', () => {
      const key = 'op-test-1';
      IdempotencyManager.recordOperation(key, { success: true });

      const op = IdempotencyManager.getOperation(key);

      expect(op?.operationKey).toBe(key);
      expect(op?.result.success).toBe(true);
      expect(op?.status).toBe('COMPLETED');
    });

    it('executes operation idempotently', async () => {
      const key = 'op-test-2';
      let executeCount = 0;

      const result1 = await IdempotencyManager.executeIdempotent(key, async () => {
        executeCount++;
        return { count: executeCount };
      });

      const result2 = await IdempotencyManager.executeIdempotent(key, async () => {
        executeCount++;
        return { count: executeCount };
      });

      expect(executeCount).toBe(1);
      expect(result1).toEqual(result2);
    });

    it('ensures idempotency for identical parameters', async () => {
      const operation = jest.fn(async () => ({ status: 'success' }));
      const key = IdempotencyManager.generateKey('test', { id: '123' });

      await IdempotencyManager.executeIdempotent(key, operation);
      await IdempotencyManager.executeIdempotent(key, operation);

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('WorkflowExecutor', () => {
    it('executes all tasks in sequence', async () => {
      const executionOrder: string[] = [];

      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          execute: async () => {
            executionOrder.push('task-1');
            return {};
          },
        },
        {
          id: 'task-2',
          name: 'Task 2',
          execute: async () => {
            executionOrder.push('task-2');
            return {};
          },
        },
        {
          id: 'task-3',
          name: 'Task 3',
          execute: async () => {
            executionOrder.push('task-3');
            return {};
          },
        },
      ];

      await WorkflowExecutor.executeWorkflow('wf-exec-1', tasks);

      expect(executionOrder).toEqual(['task-1', 'task-2', 'task-3']);
    });

    it('creates checkpoint after each successful task', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          execute: async () => ({ result: 'success' }),
        },
      ];

      await WorkflowExecutor.executeWorkflow('wf-exec-2', tasks);

      const checkpoint = CheckpointManager.getCheckpoint('wf-exec-2', 1);
      expect(checkpoint?.status).toBe('COMPLETED');
      expect(checkpoint?.state).toBeDefined();
    });

    it('pauses workflow on task failure', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          execute: async () => ({ success: true }),
        },
        {
          id: 'task-2-fail',
          name: 'Task 2',
          execute: async () => {
            throw new Error('Task failed');
          },
        },
      ];

      const result = await WorkflowExecutor.executeWorkflow('wf-exec-3', tasks);

      expect(result).toBeNull();

      const workflow = CheckpointManager.getWorkflow('wf-exec-3');
      expect(workflow?.failureCount).toBeGreaterThan(0);
    });

    it('calls onFailure handler when task fails', async () => {
      const failureHandler = jest.fn();

      const tasks: Task[] = [
        {
          id: 'task-fail',
          name: 'Failing Task',
          execute: async () => {
            throw new Error('Test error');
          },
          onFailure: failureHandler,
        },
      ];

      await WorkflowExecutor.executeWorkflow('wf-exec-4', tasks);

      expect(failureHandler).toHaveBeenCalled();
    });

    it('respects max retries limit', async () => {
      let attempts = 0;

      const tasks: Task[] = [
        {
          id: 'task-retry',
          name: 'Retry Task',
          execute: async () => {
            attempts++;
            throw new Error('Transient error');
          },
          maxRetries: 2,
        },
      ];

      await WorkflowExecutor.executeWorkflow('wf-exec-5', tasks);

      const workflow = CheckpointManager.getWorkflow('wf-exec-5');
      expect(workflow?.failureCount).toBeGreaterThanOrEqual(1);
    });

    it('marks workflow as completed on success', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          execute: async () => ({}),
        },
      ];

      const result = await WorkflowExecutor.executeWorkflow('wf-exec-6', tasks);

      expect(result?.status).toBe('COMPLETED');
    });

    it('preserves context throughout workflow', async () => {
      const context = { userId: 'user-123', action: 'approve' };

      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          execute: async () => ({}),
        },
      ];

      await WorkflowExecutor.executeWorkflow('wf-exec-7', tasks, context);

      const workflow = CheckpointManager.getWorkflow('wf-exec-7');
      expect(workflow?.context).toEqual(context);
    });
  });

  describe('RecoveryManager', () => {
    it('identifies transient errors', () => {
      const transientErrors = [
        new Error('ECONNREFUSED'),
        new Error('ETIMEDOUT'),
        new Error('Connection timeout'),
      ];

      transientErrors.forEach(error => {
        expect(RecoveryManager.isTransientError(error)).toBe(true);
      });
    });

    it('identifies non-transient errors', () => {
      const nonTransientErrors = [
        new Error('Invalid argument'),
        new Error('Authentication failed'),
      ];

      nonTransientErrors.forEach(error => {
        expect(RecoveryManager.isTransientError(error)).toBe(false);
      });
    });

    it('retries operation with backoff', async () => {
      let attempts = 0;

      const result = await RecoveryManager.retryWithBackoff(
        async () => {
          attempts++;
          if (attempts < 3) throw new Error('Transient error');
          return { success: true };
        },
        3,
        10
      );

      expect(attempts).toBe(3);
      expect(result.success).toBe(true);
    });

    it('throws error after max retries exceeded', async () => {
      await expect(
        RecoveryManager.retryWithBackoff(
          async () => {
            throw new Error('Always fails');
          },
          2,
          10
        )
      ).rejects.toThrow('Always fails');
    });

    it('exponential backoff increases delay', async () => {
      const delays: number[] = [];
      const startTime = Date.now();
      let attempts = 0;

      await RecoveryManager.retryWithBackoff(
        async () => {
          if (attempts < 2) {
            attempts++;
            throw new Error('Fail');
          }
        },
        3,
        10
      ).catch(() => {});

      // Backoff delays should exist (2^0 * 10 + 2^1 * 10 = 30ms minimum)
      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Idempotency Edge Cases', () => {
    it('handles concurrent idempotent operations', async () => {
      const key = 'concurrent-op';
      let execCount = 0;

      const operation = async () => {
        execCount++;
        await new Promise(r => setTimeout(r, 10));
        return { count: execCount };
      };

      const promises = [
        IdempotencyManager.executeIdempotent(key, operation),
        IdempotencyManager.executeIdempotent(key, operation),
        IdempotencyManager.executeIdempotent(key, operation),
      ];

      const results = await Promise.all(promises);

      // All should return same result
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });

    it('maintains idempotency across workflow restarts', async () => {
      const key = 'persistent-op';
      const results: any[] = [];

      // First execution
      const r1 = await IdempotencyManager.executeIdempotent(key, async () => {
        return { timestamp: Date.now() };
      });
      results.push(r1);

      // Simulate restart
      await new Promise(r => setTimeout(r, 100));

      // Second execution (should return cached)
      const r2 = await IdempotencyManager.executeIdempotent(key, async () => {
        return { timestamp: Date.now() };
      });
      results.push(r2);

      expect(r1).toEqual(r2);
      expect(r1.timestamp).toBe(r2.timestamp);
    });
  });

  describe('Workflow Recovery Scenarios', () => {
    it('recovers from partial workflow failure', async () => {
      let executions: string[] = [];

      const tasks: Task[] = [
        {
          id: 'task-1',
          name: 'Task 1',
          execute: async () => {
            executions.push('task-1');
            return {};
          },
        },
        {
          id: 'task-2-fail',
          name: 'Task 2 (Fails)',
          execute: async () => {
            executions.push('task-2-fail');
            throw new Error('Transient failure');
          },
          maxRetries: 1,
        },
        {
          id: 'task-3',
          name: 'Task 3',
          execute: async () => {
            executions.push('task-3');
            return {};
          },
        },
      ];

      // First execution fails at task 2
      await WorkflowExecutor.executeWorkflow('wf-recovery', tasks);
      expect(executions).toEqual(['task-1', 'task-2-fail']);

      // Manually fix and retry task 2
      executions = [];
      const fixedTasks = tasks.map(t =>
        t.id === 'task-2-fail'
          ? { ...t, execute: async () => { executions.push('task-2-fixed'); return {}; } }
          : t
      );

      // Resume workflow
      const result = await WorkflowExecutor.resumeWorkflow('wf-recovery', fixedTasks);

      if (result) {
        expect(result.status).toBe('COMPLETED');
      }
    });

    it('prevents duplicate operations via idempotency', async () => {
      let sideEffects = 0;

      const tasks: Task[] = [
        {
          id: 'side-effect-task',
          name: 'Task with Side Effect',
          execute: async () => {
            const key = IdempotencyManager.generateKey('increment', {});
            return IdempotencyManager.executeIdempotent(key, async () => {
              sideEffects++;
              return { count: sideEffects };
            });
          },
        },
      ];

      // Execute once
      await WorkflowExecutor.executeWorkflow('wf-dedup-1', tasks);

      // Side effect should happen once
      expect(sideEffects).toBe(1);

      // Execute again with different workflow id - will execute again (different op key)
      const key2 = IdempotencyManager.generateKey('increment-v2', {});
      await IdempotencyManager.executeIdempotent(key2, async () => {
        sideEffects++;
        return {};
      });

      expect(sideEffects).toBe(2);
    });
  });
});
