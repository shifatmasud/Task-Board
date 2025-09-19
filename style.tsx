import type React from 'react';
import { Priority } from './types';

const mixins = {
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

export const styles: { [key: string]: React.CSSProperties | { [key: string]: React.CSSProperties } } = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'var(--bg-base)',
  },
  header: {
    ...mixins.flexBetween,
    padding: '12px 24px',
    backgroundColor: 'rgba(10, 10, 10, 0.7)',
    borderBottom: `1px solid var(--border-subtle)`,
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  boardContainer: {
    display: 'flex',
    flexGrow: 1,
    padding: '24px',
    gap: '24px',
    overflowX: 'auto',
    alignItems: 'flex-start',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    width: '340px',
    minWidth: '340px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--border-subtle)',
    maxHeight: 'calc(100vh - 120px)',
    transition: 'opacity 0.2s, box-shadow 0.2s',
  },
  columnDragging: {
      boxShadow: `var(--shadow-lg)`,
      transform: 'rotate(1deg)',
  },
  columnHeader: {
    ...mixins.flexBetween,
    padding: '16px 20px 12px 20px',
    cursor: 'grab',
  },
  columnHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  columnTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  taskCount: {
    backgroundColor: 'var(--bg-base)',
    color: 'var(--text-secondary)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    flexGrow: 1,
    padding: '0 12px 12px 12px',
    minHeight: '100px',
  },
  taskCard: {
    backgroundColor: 'var(--bg-surface-raised)',
    borderRadius: 'var(--border-radius-md)',
    border: `1px solid var(--border-default)`,
    transition: 'background-color 0.2s, box-shadow 0.2s, transform 0.2s, border-color 0.2s, opacity 0.2s',
    display: 'flex',
    position: 'relative',
    gap: '8px',
    alignItems: 'flex-start',
    cursor: 'grab',
    boxShadow: 'var(--shadow-sm)',
  },
  taskCardDragging: {
    boxShadow: `var(--shadow-lg)`,
    transform: 'rotate(2deg) scale(1.03)',
  },
  dragHandle: {
    padding: '16px 0 16px 16px',
    color: 'var(--text-tertiary)',
    transition: 'color 0.2s',
  },
  taskCardContent: {
    flexGrow: 1,
    padding: '16px 16px 16px 0',
  },
  taskTitle: {
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: '8px',
    fontSize: '1rem',
    paddingRight: '24px', // Space for edit button
  },
  taskFooter: {
    ...mixins.flexBetween,
    marginTop: '16px',
  },
  priorityBadge: {
    padding: '4px 10px',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  taskMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  metaItem: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  taskEditButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, color 0.2s, opacity 0.2s',
    opacity: 0,
  },
  checklist: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  subtask: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    padding: '4px',
    borderRadius: 'var(--border-radius-sm)',
    transition: 'background-color 0.2s',
  },
  subtaskHover: {
      backgroundColor: 'var(--bg-surface-hover)',
  },
  subtaskLabel: {
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    flexGrow: 1,
  },
  subtaskLabelCompleted: {
    textDecoration: 'line-through',
    color: 'var(--text-tertiary)',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    backgroundColor: 'transparent',
    border: `1.5px solid var(--text-tertiary)`,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: 'var(--accent-primary)',
    borderColor: 'var(--accent-primary)',
  },
  // Modal styles
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'var(--bg-surface-raised)',
    padding: '32px',
    borderRadius: 'var(--border-radius-lg)',
    width: '90%',
    maxWidth: '600px',
    border: `1px solid var(--border-default)`,
    boxShadow: 'var(--shadow-lg)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    ...mixins.flexBetween,
    marginBottom: '24px',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  modalBody: {
    overflowY: 'auto',
    marginRight: '-16px',
    paddingRight: '16px',
    userSelect: 'text', // Re-enable text selection inside modal
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid var(--border-subtle)',
    flexShrink: 0,
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--bg-surface)',
    border: `1px solid var(--border-default)`,
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'var(--bg-surface)',
    border: `1px solid var(--border-default)`,
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    minHeight: '120px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  // Button styles
  button: {
    padding: '10px 16px',
    borderRadius: 'var(--border-radius-md)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  buttonPrimary: {
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--text-on-accent)',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    border: `1px solid var(--border-default)`,
  },
  buttonDanger: {
    backgroundColor: 'transparent',
    color: 'var(--danger)',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, color 0.2s',
  },
  // Comment Styles
  commentSection: {
    marginTop: '24px',
  },
  commentList: {
    maxHeight: '200px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
    padding: '12px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 'var(--border-radius-md)',
  },
  comment: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  commentTimestamp: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
    display: 'block',
    marginTop: '4px',
  },
  commentInputArea: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  addColumnButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '340px',
    minWidth: '340px',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: `1px dashed var(--border-default)`,
    borderRadius: 'var(--border-radius-lg)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
    height: 'fit-content',
  },
};

export const getPriorityStyle = (priority: Priority): React.CSSProperties => {
  const baseStyle = {
    backgroundColor: 'var(--bg-surface-overlay)',
    border: '1px solid var(--border-default)',
  };
  switch (priority) {
    case Priority.High:
      return { ...baseStyle, color: 'var(--priority-high-text)' };
    case Priority.Medium:
      return { ...baseStyle, color: 'var(--priority-medium-text)' };
    case Priority.Low:
      return { ...baseStyle, color: 'var(--priority-low-text)' };
    default:
      return { ...baseStyle, color: 'var(--priority-none-text)' };
  }
};