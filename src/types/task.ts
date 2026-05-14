/** Mirrors MobileDevTeamApi.Models.TaskItem (camelCase JSON). */
export type TaskItem = {
  id: number;
  title: string;
  description?: string | null;
  completed: boolean;
  dueAt?: string | null;
};
