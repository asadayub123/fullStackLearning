import type {TaskItem} from '../types/task';
import {httpClient} from './httpClient';

type ApiEnvelope<T> = {data: T};

function unwrap<T>(payload: ApiEnvelope<T>): T {
  return payload.data;
}

export async function fetchTasks(): Promise<TaskItem[]> {
  const {data} = await httpClient.get<ApiEnvelope<TaskItem[]>>('/Tasks');
  return unwrap(data);
}

export async function fetchTask(id: number): Promise<TaskItem> {
  const {data} = await httpClient.get<ApiEnvelope<TaskItem>>(`/Tasks/${id}`);
  return unwrap(data);
}

export async function createTask(
  item: Omit<TaskItem, 'id'>,
): Promise<TaskItem> {
  const body = {
    id: 0,
    title: item.title,
    description: item.description ?? '',
    completed: item.completed ?? false,
    dueAt: item.dueAt ?? null,
  };
  const {data} = await httpClient.post<ApiEnvelope<TaskItem>>('/Tasks', body);
  return unwrap(data);
}

export async function updateTask(item: TaskItem): Promise<void> {
  await httpClient.put(`/Tasks/${item.id}`, {
    id: item.id,
    title: item.title,
    description: item.description ?? '',
    completed: item.completed,
    dueAt: item.dueAt ?? null,
  });
}

export async function deleteTask(id: number): Promise<void> {
  await httpClient.delete(`/Tasks/${id}`);
}
