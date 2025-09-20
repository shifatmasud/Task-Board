import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Subtask } from '../types';
import { Priority } from '../types';
import { styles, getPriorityIndicatorStyle } from '../style';
import Icon from './Icon';
import AnimatedCounter from './AnimatedCounter';

interface TaskCardProps {
  task: Task;
  onUpdateTask: (updatedTask: Task) => void;
  onEdit: () => void;
  isDragOverlay?: boolean;
}

const useCanHover = () => {
    const [canHover, setCanHover] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return;
        const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        const updateCanHover = () => setCanHover(mediaQuery.matches);
        updateCanHover();
        mediaQuery.addEventListener('change', updateCanHover);
        return () => mediaQuery.removeEventListener('change', updateCanHover);
    }, []);
    return canHover;
};

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

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateTask, onEdit, isDragOverlay = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(task.title);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const canHover = useCanHover();
  
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
      },
      disabled: isDragOverlay,
  });
  
  const handleNodeRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    cardRef.current = node;
  }, [setNodeRef]);
  
  useEffect(() => {
    const element = cardRef.current;
    if (!element || isDragOverlay) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      element.style.setProperty('--cursor-x', `${x}px`);
      element.style.setProperty('--cursor-y', `${y}px`);
    };

    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragOverlay]);


  const dndTransform = CSS.Transform.toString(transform);

  const style: React.CSSProperties = {
    ...styles.taskCard,
    transition,
    transform: dndTransform,
    zIndex: isDragging ? 10 : 'auto',
  };
  
  if (isDragging) {
    // The original item in the list is being dragged. Hide it.
    style.opacity = 0;
  }

  if (isDragOverlay) {
    // This is the item rendered in the DragOverlay.
    style.cursor = 'grabbing';
    style.boxShadow = (styles.taskCardDragging as React.CSSProperties).boxShadow;
    style.transform = `${(styles.taskCardDragging as React.CSSProperties).transform}`;
  }


  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTitle(e.target.value);
  }

  const handleTitleSave = () => {
    if (currentTitle.trim() && currentTitle.trim() !== task.title) {
        onUpdateTask({ ...task, title: currentTitle.trim() });
    }
    setIsEditingTitle(false);
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleTitleSave();
    } else if (e.key === 'Escape') {
        setCurrentTitle(task.title);
        setIsEditingTitle(false);
    }
    e.stopPropagation();
  }

  const handleSubtaskToggle = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(subtask =>
      subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };
  
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  }

  return (
    <motion.div
      ref={handleNodeRef}
      className={!isDragOverlay ? 'task-card-interactive-hover' : ''}
      style={style}
      {...attributes}
      {...listeners}
      layoutId={isDragOverlay ? undefined : task.id}
      whileHover={isDragOverlay || !canHover ? {} : { 
        backgroundColor: 'var(--bg-surface-hover)', 
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-md)',
        zIndex: 2,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        <div 
            style={{...styles.priorityIndicator, ...getPriorityIndicatorStyle(task.priority)}}
        />
        
        <div style={styles.taskCardContent}>
            {isEditingTitle ? (
                <input
                    style={{...styles.inlineEditInput, fontSize: '0.9rem', fontWeight: 500 }}
                    value={currentTitle}
                    onChange={handleTitleChange}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                />
            ) : (
                <h3 
                    style={styles.taskTitle} 
                    onDoubleClick={handleTitleDoubleClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >{task.title}</h3>
            )}
            
            {task.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 12px 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{task.description}</p>}

            {totalSubtasks > 0 && (
                <div style={styles.checklist}>
                {task.subtasks.map(subtask => (
                    <SubtaskItem key={subtask.id} subtask={subtask} onToggle={() => handleSubtaskToggle(subtask.id)} />
                ))}
                </div>
            )}
            
            {totalSubtasks > 0 && (
                <div style={styles.progressBarContainer}>
                    <div style={{ ...styles.progressBarFill, width: `${(completedSubtasks / totalSubtasks) * 100}%` }} />
                </div>
            )}

            <div style={styles.taskFooter}>
                <div />
                <div style={styles.taskMeta}>
                    {task.comments.length > 0 && (
                        <motion.span 
                            style={styles.metaItem}
                            animate={{ scale: isHovered && canHover ? 1.1 : 1 }}
                            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1], delay: 0.1 }}
                        >
                            <Icon name="chat-circle-dots" weight="bold" size={14} />
                            <AnimatedCounter value={task.comments.length} fontSize={13} />
                        </motion.span>
                    )}
                    {totalSubtasks > 0 && (
                        <motion.span 
                            style={styles.metaItem}
                            animate={{ scale: isHovered && canHover ? 1.1 : 1 }}
                            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1], delay: 0.15 }}
                        >
                            <Icon name="check-square" weight="bold" size={14} />
                            <AnimatedCounter value={completedSubtasks} fontSize={13} />
                            <span style={{fontSize: '0.8rem', margin: '0 2px'}}>/</span>
                            <AnimatedCounter value={totalSubtasks} fontSize={13} />
                        </motion.span>
                    )}
                </div>
            </div>
        </div>
        <AnimatePresence>
         {isHovered && canHover && (
            <motion.button 
                style={{ ...styles.taskEditButton }} 
                onClick={handleEditClick}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label="Edit task"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                whileHover={{ scale: 1.1, color: 'var(--text-primary)' }}
                whileTap={{ scale: 0.9 }}
            >
                <Icon name="pencil-simple" size={16} />
            </motion.button>
         )}
        </AnimatePresence>
    </motion.div>
  );
};

export default TaskCard;