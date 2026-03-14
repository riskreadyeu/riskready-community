import { useEffect, useState } from "react";
import { notifyError } from "@/lib/app-errors";
import {
  getIncident,
  getIncidentCommunications,
  getIncidentEvidence,
  getIncidentLessonsLearned,
  getIncidentNotifications,
  getIncidentTimeline,
  type Incident,
  type IncidentCommunication,
  type IncidentEvidence,
  type IncidentLessonsLearned,
  type IncidentNotification,
  type IncidentTimelineEntry,
} from "@/lib/incidents-api";

export function useIncidentDetail(incidentId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<IncidentTimelineEntry[]>([]);
  const [evidence, setEvidence] = useState<IncidentEvidence[]>([]);
  const [communications, setCommunications] = useState<IncidentCommunication[]>([]);
  const [lessonsLearned, setLessonsLearned] = useState<IncidentLessonsLearned[]>([]);
  const [notifications, setNotifications] = useState<IncidentNotification[]>([]);

  async function refresh() {
    if (!incidentId) {
      setLoading(false);
      setIncident(null);
      setTimeline([]);
      setEvidence([]);
      setCommunications([]);
      setLessonsLearned([]);
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      const incidentData = await getIncident(incidentId);
      setIncident(incidentData);

      const [timelineData, evidenceData, communicationsData, lessonsData, notificationsData] =
        await Promise.all([
          getIncidentTimeline(incidentId).catch(() => []),
          getIncidentEvidence(incidentId).catch(() => []),
          getIncidentCommunications(incidentId).catch(() => []),
          getIncidentLessonsLearned(incidentId).catch(() => []),
          getIncidentNotifications(incidentId).catch(() => []),
        ]);

      setTimeline(timelineData);
      setEvidence(evidenceData);
      setCommunications(communicationsData);
      setLessonsLearned(lessonsData);
      setNotifications(notificationsData);
    } catch (error) {
      notifyError("Error loading incident:", error, "Failed to load incident");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [incidentId]);

  return {
    loading,
    incident,
    timeline,
    evidence,
    communications,
    lessonsLearned,
    notifications,
    refresh,
  };
}
