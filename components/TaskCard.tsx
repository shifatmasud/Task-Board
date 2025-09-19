import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Subtask } from '../types';
import { Priority } from '../types';
import { styles, getPriorityStyle } from '../style';
import Icon from './Icon';

interface TaskCardProps {
  task: Task;
  onUpdateTask: (updatedTask: Task) => void;
  onEdit: () => void;
}

const Checkbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <div 
        style={{ ...styles.checkbox, ...(checked ? styles.checkboxChecked : {}) }} 
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        role="checkbox"
        aria-checked={checked}
    >
        {checked && <Icon name="check" weight="bold" size={12} style={{ color: 'var(--text-on-accent)' }} />}
    </div>
);

const SubtaskItem: React.FC<{subtask: Subtask, onToggle: () => void}> = ({subtask, onToggle}) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
         <div 
            style={{...styles.subtask, ...(isHovered ? styles.subtaskHover : {})}}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => e.stopPropagation()}
        >
          <Checkbox checked={subtask.completed} onChange={onToggle} />
          <label 
            style={{
              ...styles.subtaskLabel, 
              ...(subtask.completed ? styles.subtaskLabelCompleted : {})
            }}
            onClick={onToggle}
          >
            {subtask.text}
          </label>
        </div>
    );
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateTask, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
      id: task.id,
      data: {
          type: 'Task',
          task,
      }
  });

  const dndTransform = CSS.Transform.toString(transform);

  const style: React.CSSProperties = {
    ...styles.taskCard,
    transition,
    transform: dndTransform,
    zIndex: isDragging ? 10 : 'auto',
  };

  if (isDragging) {
    style.boxShadow = (styles.taskCardDragging as React.CSSProperties).boxShadow;
    const customTransform = (styles.taskCardDragging as React.CSSProperties).transform;
    style.transform = `${dndTransform || ''} ${customTransform || ''}`;
    style.opacity = 0.5;
  }


  const handleSubtaskToggle = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(subtask =>
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };
  
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.High: return "arrow-up";
      case Priority.Medium: return "minus";
      case Priority.Low: return "arrow-down";
      default: return null;
    }
  }
  const priorityIcon = getPriorityIcon(task.priority);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layoutId={task.id}
      whileHover={{ backgroundColor: 'var(--bg-surface-hover)', borderColor: 'var(--text-tertiary)' }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onEdit}
    >
        <div style={styles.dragHandle} onClick={(e) => e.stopPropagation()}>
            <Icon name="dots-six-vertical" weight="bold" size={18} />
        </div>
        
        <div style={styles.taskCardContent}>
            <h3 style={styles.taskTitle}>{task.title}</h3>
            {task.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 12px 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{task.description}</p>}

            {totalSubtasks > 0 && (
                <div style={styles.checklist}>
                {task.subtasks.map(subtask => (
                    <SubtaskItem key={subtask.id} subtask={subtask} onToggle={() => handleSubtaskToggle(subtask.id)} />
                ))}
                </div>
            )}

            <div style={styles.taskFooter}>
                <span style={{ ...styles.priorityBadge, ...getPriorityStyle(task.priority) }}>
                {priorityIcon && <Icon name={priorityIcon} weight="bold" size={14}/>}
                {task.priority}
                </span>
                <div style={styles.taskMeta}>
                    {task.comments.length > 0 && (
                        <span style={styles.metaItem}>
                            <Icon name="chat-circle-dots" weight="bold" size={14} />
                            {task.comments.length}
                        </span>
                    )}
                    {totalSubtasks > 0 && (
                        <span style={styles.metaItem}>
                            <Icon name="check-square" weight="bold" size={14} />
                            {completedSubtasks}/{totalSubtasks}
                        </span>
                    )}
                </div>
            </div>
        </div>
         <button 
            style={{ 
                ...styles.taskEditButton, 
                opacity: isHovered ? 1 : 0 ,
                ...(isHovered && {backgroundColor: 'var(--bg-surface-overlay)', color: 'var(--text-primary)'})
            }} 
            onClick={handleEditClick}
            aria-label="Edit task"
        >
            <Icon name="pencil-simple" size={16} />
        </button>
    </motion.div>
  );
};

export default TaskCard;