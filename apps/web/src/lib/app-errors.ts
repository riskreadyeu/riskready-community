import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return getApiErrorMessage(error.message, fallback);
  }

  return fallback;
}

export function logAppError(context: string, error: unknown): string {
  console.error(context, error);
  return getErrorMessage(error, context);
}

export function notifyError(context: string, error: unknown, fallback = context): string {
  const message = getErrorMessage(error, fallback);
  console.error(context, error);
  toast.error(message);
  return message;
}
