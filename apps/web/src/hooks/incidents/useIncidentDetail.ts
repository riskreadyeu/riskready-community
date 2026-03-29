import {
  useIncident,
  useIncidentTimeline,
  useIncidentEvidence,
  useIncidentCommunications,
  useIncidentLessonsLearned,
  useIncidentNotifications,
} from "@/hooks/queries";

export function useIncidentDetail(incidentId: string | undefined) {
  const id = incidentId ?? '';

  const { data: incident = null, isLoading: incidentLoading, refetch } = useIncident(id);
  const { data: timeline = [], isLoading: timelineLoading } = useIncidentTimeline(id);
  const { data: evidence = [], isLoading: evidenceLoading } = useIncidentEvidence(id);
  const { data: communications = [], isLoading: commsLoading } = useIncidentCommunications(id);
  const { data: lessonsLearned = [], isLoading: lessonsLoading } = useIncidentLessonsLearned(id);
  const { data: notifications = [], isLoading: notificationsLoading } = useIncidentNotifications(id);

  const loading = incidentLoading || timelineLoading || evidenceLoading || commsLoading || lessonsLoading || notificationsLoading;

  return {
    loading,
    incident,
    timeline,
    evidence,
    communications,
    lessonsLearned,
    notifications,
    refresh: refetch,
  };
}
