export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function logAppError(context: string, error: unknown): string {
  console.error(context, error);
  return getErrorMessage(error, context);
}
