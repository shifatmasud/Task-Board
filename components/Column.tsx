

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Column as ColumnType, Task } from '../types';
import { styles } from '../style';
import TaskCard from './TaskCard';
import Icon from './Icon';

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

const Column: React.FC<ColumnProps> = ({ column, onUpdateTask, onAddTask, onEditTask, onDeleteColumn, onRenameColumn, isDragOverlay = false, isMobile = false }) => {
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: column.id });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(column.title);

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
      <div style={styles.columnHeader} {...attributes} {...listeners}>
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
            <span style={styles.taskCount}>{column.tasks.length}</span>
        </div>
        <div style={styles.columnHeaderActions}>
            <button 
                style={styles.iconButton} 
                onClick={onAddTask}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                <Icon name="plus" size={20} />
            </button>
            <button 
                style={{...styles.iconButton, cursor: 'pointer'}} 
                onClick={handleDeleteClick}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                <Icon name="trash" size={20} />
            </button>
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