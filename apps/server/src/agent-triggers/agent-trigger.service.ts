import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * Listens for domain events and can trigger agent runs via the gateway.
 * In Community Edition, events are logged and can be configured to trigger
 * scheduled agent tasks.
 */
@Injectable()
export class AgentTriggerService {
  private readonly logger = new Logger(AgentTriggerService.name);
  private gatewayUrl: string;

  constructor() {
    this.gatewayUrl = process.env['GATEWAY_URL'] || 'http://localhost:3100';
  }

  @OnEvent('incident.created')
  async onIncidentCreated(payload: {
    incidentId: string;
    referenceNumber: string;
    title: string;
    severity: string;
    organisationId: string;
  }) {
    this.logger.log(`Event: incident.created — ${payload.referenceNumber} (${payload.severity})`);

    // For CRITICAL/HIGH severity, notify the gateway to trigger analysis
    if (payload.severity === 'CRITICAL' || payload.severity === 'HIGH') {
      await this.dispatchToGateway({
        organisationId: payload.organisationId,
        text: `[AUTOMATED] A new ${payload.severity} severity incident has been created: ${payload.referenceNumber} — "${payload.title}". Please analyze this incident, identify potentially affected controls, and suggest immediate response actions.`,
        trigger: 'incident.created',
        triggerData: { incidentId: payload.incidentId },
      });
    }
  }

  @OnEvent('incident.status_changed')
  async onIncidentStatusChanged(payload: {
    incidentId: string;
    referenceNumber: string;
    previousStatus: string;
    newStatus: string;
    organisationId: string;
  }) {
    this.logger.log(`Event: incident.status_changed — ${payload.referenceNumber}: ${payload.previousStatus} → ${payload.newStatus}`);
  }

  @OnEvent('approval.resolved')
  async onApprovalResolved(payload: {
    actionId: string;
    actionType: string;
    status: string;
    reviewNotes?: string;
    organisationId: string;
  }) {
    this.logger.log(`Event: approval.resolved — ${payload.actionId} (${payload.status})`);
    // The scheduler service handles approval-triggered resume via AWAITING_APPROVAL task polling
  }

  private async dispatchToGateway(params: {
    organisationId: string;
    text: string;
    trigger: string;
    triggerData?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const response = await fetch(`${this.gatewayUrl}/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env['GATEWAY_SECRET'] ? { 'x-gateway-secret': process.env['GATEWAY_SECRET'] } : {}),
        },
        body: JSON.stringify({
          organisationId: params.organisationId,
          text: params.text,
          channel: 'web',
          userId: 'system',
          metadata: {
            isEvent: true,
            trigger: params.trigger,
            ...params.triggerData,
          },
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Gateway dispatch failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      this.logger.warn(`Failed to dispatch to gateway: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
