import { useEffect, useState } from "react";
import {
  approveCap,
  closeNonconformity,
  getNonconformity,
  getUsers,
  markCapNotRequired,
  rejectCap,
  saveCapDraft,
  submitCapForApproval,
  type Nonconformity,
  type UserBasic,
} from "@/lib/audits-api";
import { notifyError } from "@/lib/app-errors";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

export function useNonconformityDetail(id: string | undefined, isNew: boolean) {
  const { userId: currentUserId } = useCurrentUser();
  const [loading, setLoading] = useState(!isNew);
  const [nc, setNc] = useState<Nonconformity | null>(null);
  const [users, setUsers] = useState<UserBasic[]>([]);
  const [defineCapOpen, setDefineCapOpen] = useState(false);
  const [approveCapOpen, setApproveCapOpen] = useState(false);

  async function refresh() {
    if (!id || isNew) {
      setLoading(false);
      setNc(null);
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const [ncData, usersData] = await Promise.all([
        getNonconformity(id),
        getUsers(),
      ]);
      setNc(ncData);
      setUsers(usersData);
    } catch (error) {
      notifyError("Error loading nonconformity:", error, "Failed to load nonconformity");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [id, isNew]);

  const isOverdue = Boolean(
    nc?.targetClosureDate &&
      nc.status !== "CLOSED" &&
      new Date(nc.targetClosureDate) < new Date()
  );

  const canDefineCap = Boolean(
    nc?.status === "OPEN" && ["NOT_DEFINED", "DRAFT", "REJECTED"].includes(nc.capStatus)
  );
  const canApproveCap = nc?.capStatus === "PENDING_APPROVAL";
  const canSkipCap = Boolean(
    nc?.status === "OPEN" &&
      nc.severity === "OBSERVATION" &&
      nc.capStatus === "NOT_DEFINED"
  );

  function getCurrentUserId() {
    if (!currentUserId) {
      throw new Error("Current user is not available");
    }

    return currentUserId;
  }

  async function handleClose() {
    if (!nc || !id) return;
    const confirmed = window.confirm("Are you sure you want to close this nonconformity?");
    if (!confirmed) return;

    try {
      await closeNonconformity(id, getCurrentUserId());
      await refresh();
    } catch (error) {
      notifyError("Failed to close nonconformity", error);
    }
  }

  async function handleSaveCapDraft(data: {
    correctiveAction: string;
    rootCause?: string;
    responsibleUserId: string;
    targetClosureDate: Date;
  }) {
    if (!id) return;

    try {
      await saveCapDraft(id, {
        ...data,
        targetClosureDate: data.targetClosureDate.toISOString(),
        draftedById: getCurrentUserId(),
      });
      await refresh();
    } catch (error) {
      notifyError("Failed to save CAP draft", error);
    }
  }

  async function handleSubmitForApproval() {
    if (!id) return;

    try {
      await submitCapForApproval(id, getCurrentUserId());
      await refresh();
      setDefineCapOpen(false);
    } catch (error) {
      notifyError("Failed to submit CAP for approval", error);
    }
  }

  async function handleApproveCap(comments?: string) {
    if (!id) return;

    try {
      await approveCap(id, getCurrentUserId(), comments);
      await refresh();
    } catch (error) {
      notifyError("Failed to approve CAP", error);
    }
  }

  async function handleRejectCap(reason: string) {
    if (!id) return;

    try {
      await rejectCap(id, getCurrentUserId(), reason);
      await refresh();
    } catch (error) {
      notifyError("Failed to reject CAP", error);
    }
  }

  async function handleSkipCap() {
    if (!id || !nc) return;
    if (nc.severity !== "OBSERVATION") {
      toast.error("Only Observations can skip CAP approval");
      return;
    }

    const confirmed = window.confirm(
      "Skip CAP approval for this Observation? The NC will move directly to In Progress."
    );
    if (!confirmed) return;

    try {
      await markCapNotRequired(id, getCurrentUserId());
      await refresh();
    } catch (error) {
      notifyError("Failed to skip CAP", error);
    }
  }

  return {
    loading,
    nc,
    users,
    refresh,
    currentUserId,
    defineCapOpen,
    setDefineCapOpen,
    approveCapOpen,
    setApproveCapOpen,
    isOverdue,
    canDefineCap,
    canApproveCap,
    canSkipCap,
    handleClose,
    handleSaveCapDraft,
    handleSubmitForApproval,
    handleApproveCap,
    handleRejectCap,
    handleSkipCap,
  };
}
