import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
}

const Column: React.FC<ColumnProps> = ({ column, onUpdateTask, onAddTask, onEditTask, onDeleteColumn }) => {
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({ id: column.id });

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
  });

  const style: React.CSSProperties = {
    ...styles.column,
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    style.opacity = 0.5;
    style.boxShadow = (styles.columnDragging as React.CSSProperties).boxShadow;
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={styles.columnHeader} {...attributes} {...listeners}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={styles.columnTitle}>{column.title}</h2>
          <span style={styles.taskCount}>{column.tasks.length}</span>
        </div>
        <div style={styles.columnHeaderActions}>
            <button style={styles.iconButton} onClick={onAddTask}>
                <Icon name="plus" size={20} />
            </button>
            <button style={{...styles.iconButton, cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); onDeleteColumn(column.id); }}>
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
            layout
            style={{
                ...styles.taskList, 
                backgroundColor: isOver ? 'var(--bg-surface-overlay)' : 'transparent',
                transition: 'background-color 0.2s'
            }}
        >
            <AnimatePresence>
            {column.tasks.map((task) => (
                <TaskCard 
                    key={task.id}
                    task={task} 
                    onUpdateTask={onUpdateTask}
                    onEdit={() => onEditTask(task)}
                />
            ))}
            </AnimatePresence>
        </motion.div>
      </SortableContext>
    </div>
  );
};

export default Column;