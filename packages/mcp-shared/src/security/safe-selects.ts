export const userSelectSafe = {
  id: true,
  firstName: true,
  lastName: true,
} as const;

export type SafeUser = {
  id: string;
  firstName: string;
  lastName: string;
};
