

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column as ColumnType, Task } from '../types';
import { styles } from '../style';
import TaskCard from './TaskCard';
import Icon from './Icon';
import AnimatedCounter from './AnimatedCounter';

interface ColumnProps {
  column: ColumnType;
  onUpdateTask: (updatedTask: Task) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (newTitle: string) => void;
  isDragOverlay?: boolean;
  isMobile?: boolean;
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

const Column: React.FC<ColumnProps> = ({ column, onUpdateTask, onAddTask, onEditTask, onDeleteColumn, onRenameColumn, isDragOverlay = false, isMobile = false }) => {
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: column.id });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(column.title);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const canHover = useCanHover();

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column: column,
    },
    disabled: isDragOverlay,
  });

  const style: React.CSSProperties = {
    ...styles.column,
    transition,
    transform: CSS.Transform.toString(transform),
    ...(isMobile && { width: '100%', minWidth: 'unset' }),
  };

  if (isDragging) {
    // Original item being dragged. Make it a semi-transparent placeholder.
    style.opacity = 0.4;
  }
  
  if (isDragOverlay) {
     // Item in overlay.
    style.boxShadow = (styles.columnDragging as React.CSSProperties).boxShadow;
    style.cursor = 'grabbing';
  }
  
  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTitle(e.target.value);
  };

  const handleTitleSave = () => {
    if (currentTitle.trim() && currentTitle.trim() !== column.title) {
        onRenameColumn(currentTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleTitleSave();
    } else if (e.key === 'Escape') {
        setCurrentTitle(column.title);
        setIsEditingTitle(false);
    }
    e.stopPropagation();
  };
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteColumn(column.id);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div 
        style={{...styles.columnHeader, ...(isHeaderHovered && canHover && !isDragging && {backgroundColor: 'var(--bg-surface-hover)'})}} 
        {...attributes} 
        {...listeners}
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexGrow: 1, minWidth: 0 }}>
            {isEditingTitle ? (
                <input
                    style={{ ...styles.inlineEditInput, fontSize: '1rem', fontWeight: 600, width: '100%' }}
                    value={currentTitle}
                    onChange={handleTitleChange}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                    onMouseDown={(e) => e.stopPropagation()}
                />
            ) : (
                <h2 
                    style={styles.columnTitle} 
                    onDoubleClick={handleTitleDoubleClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                >{column.title}</h2>
            )}
            <motion.span 
              style={styles.taskCount}
              animate={{ scale: isHeaderHovered && canHover ? 1.1 : 1 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            >
                <AnimatedCounter value={column.tasks.length} fontSize={12} />
            </motion.span>
        </div>
        <div style={styles.columnHeaderActions}>
            <motion.button 
                style={styles.iconButton} 
                onClick={onAddTask}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                whileHover={!canHover ? {} : { scale: 1.1, color: 'var(--text-primary)' }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <Icon name="plus" size={20} />
            </motion.button>
            <motion.button 
                style={{...styles.iconButton, cursor: 'pointer'}} 
                onClick={handleDeleteClick}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                whileHover={!canHover ? {} : { scale: 1.1, color: 'var(--danger)' }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <Icon name="trash" size={20} />
            </motion.button>
        </div>
      </div>
      <SortableContext 
        id={column.id} 
        items={column.tasks.map(t => t.id)} 
        strategy={verticalListSortingStrategy}
      >
        <motion.div
            ref={setDroppableNodeRef}
            style={{
                ...styles.taskList, 
                backgroundColor: isOver ? 'var(--bg-surface-overlay)' : 'transparent',
                transition: 'background-color 0.2s'
            }}
        >
            {column.tasks.map((task) => (
                <TaskCard 
                    key={task.id}
                    task={task} 
                    onUpdateTask={onUpdateTask}
                    onEdit={() => onEditTask(task)}
                />
            ))}
        </motion.div>
      </SortableContext>
    </div>
  );
};

export default Column;