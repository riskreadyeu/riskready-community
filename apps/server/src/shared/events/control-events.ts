import { TestResult } from '@prisma/client';

type LayerType = 'GOVERNANCE' | 'PLATFORM' | 'CONSUMPTION' | 'OVERSIGHT';

/**
 * Event emitted when a layer test fails
 * This event is used to auto-create nonconformities without creating a circular dependency
 */
export class TestFailedEvent {
  constructor(
    public readonly testId: string,
    public readonly layerId: string,
    public readonly layerType: LayerType,
    public readonly testCode: string,
    public readonly testName: string,
    public readonly controlId: string,
    public readonly controlName: string,
    public readonly controlControlId: string,
    public readonly testResult: TestResult,
    public readonly findings: string | null,
    public readonly recommendations: string | null,
    public readonly sourceStandard: string | null,
    public readonly updatedById: string,
    public readonly activityId?: string,
    public readonly activityName?: string,
    public readonly assessmentTestId?: string,
    public readonly assessmentId?: string,
  ) {}
}

