
export enum Priority {
  None = 'None',
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  subtasks: Subtask[];
  comments: Comment[];
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export interface BoardState {
  columns: Record<string, Column>;
  columnOrder: string[];
}
