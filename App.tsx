import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    DndContext,
    PointerSensor, 
    KeyboardSensor, 
    useSensor, 
    useSensors,
    closestCorners,
    type DragEndEvent,
    type DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates, SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
// FIX: Import `Variants` type from framer-motion to explicitly type animation variants.
import { motion, type Variants } from 'framer-motion';

import type { BoardState, Column, Task } from './types';
import { Priority } from './types';
import ColumnComponent from './components/Column';
import TaskCard from './components/TaskCard';
import TaskModal from './components/AddTaskModal';
import { styles } from './style';
import Icon from './components/Icon';

const getInitialData = (): BoardState => ({
  columns: {
    'col-1': {
      id: 'col-1',
      title: 'To Do',
      tasks: [
        { id: 'task-1', title: 'Design the noir theme UI', priority: Priority.High, subtasks: [{id: 's1', text:'Choose color palette', completed: true}, {id: 's2', text:'Select fonts', completed: false}], comments: [] },
        { id: 'task-2', title: 'Implement drag and drop functionality', priority: Priority.High, subtasks: [], comments: [] },
      ],
    },
    'col-2': {
      id: 'col-2',
      title: 'In Progress',
      tasks: [
        { id: 'task-3', title: 'Develop the main App component', description: 'Setup state management and local storage', priority: Priority.Medium, subtasks: [], comments: [] },
      ],
    },
    'col-3': {
      id: 'col-3',
      title: 'Done',
      tasks: [
        { id: 'task-4', title: 'Setup project structure', priority: Priority.Low, subtasks: [], comments: [] },
      ],
    },
  },
  columnOrder: ['col-1', 'col-2', 'col-3'],
});

const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const mediaQueryList = window.matchMedia(query);
        const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

        mediaQueryList.addEventListener('change', listener);
        return () => mediaQueryList.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

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


const App: React.FC = () => {
    const [board, setBoard] = useState<BoardState>(() => {
    try {
      const savedBoard = localStorage.getItem('kanbanBoardState');
      return savedBoard ? JSON.parse(savedBoard) : getInitialData();
    } catch (error) {
      console.error("Could not load board state from local storage", error);
      return getInitialData();
    }
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    task?: Task;
    columnId?: string;
  }>({ isOpen: false, mode: 'add' });
  
  const [activeItem, setActiveItem] = useState<Task | Column | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const canHover = useCanHover();

  useEffect(() => {
    try {
      localStorage.setItem('kanbanBoardState', JSON.stringify(board));
    } catch (error) {
      console.error("Could not save board state to local storage", error);
    }
  }, [board]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // User must drag for 10px before a drag is initiated
      },
    }),
    useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === 'Column') {
      setActiveItem(board.columns[active.id as string]);
    } else if (type === 'Task') {
      const column = Object.values(board.columns).find(col => col.tasks.some(t => t.id === active.id));
      const task = column?.tasks.find(t => t.id === active.id);
      if (task) setActiveItem(task);
    }
  };


  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const activeType = active.data.current?.type;
    
    // Dragging a Column
    if (activeType === 'Column') {
        setBoard(board => {
            const oldIndex = board.columnOrder.indexOf(activeId);
            const newIndex = board.columnOrder.indexOf(overId);
            if (oldIndex !== -1 && newIndex !== -1) {
                return {
                    ...board,
                    columnOrder: arrayMove(board.columnOrder, oldIndex, newIndex),
                };
            }
            return board;
        });
        return;
    }
    
    // Dragging a Task
    const activeColumnId = Object.keys(board.columns).find(colId => board.columns[colId].tasks.some(t => t.id === activeId));
    let overColumnId = Object.keys(board.columns).find(colId => board.columns[colId].tasks.some(t => t.id === overId));

    if (!overColumnId && board.columns[overId]) {
        overColumnId = overId;
    }
    
    if (!activeColumnId || !overColumnId) return;
    
    setBoard(board => {
        const activeColumn = board.columns[activeColumnId];
        const overColumn = board.columns[overColumnId];
        
        if (activeColumnId === overColumnId) {
            const oldIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
            const newIndex = overColumn.tasks.findIndex(t => t.id === overId);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newTasks = arrayMove(activeColumn.tasks, oldIndex, newIndex);
                const newColumns = {
                    ...board.columns,
                    [activeColumnId]: { ...activeColumn, tasks: newTasks }
                };
                return { ...board, columns: newColumns };
            }
        } else {
            const sourceTasks = [...activeColumn.tasks];
            const destTasks = [...overColumn.tasks];
            
            const sourceIndex = sourceTasks.findIndex(t => t.id === activeId);
            const [movedTask] = sourceTasks.splice(sourceIndex, 1);
            
            let destIndex = destTasks.findIndex(t => t.id === overId);
            if (destIndex === -1) {
                destIndex = destTasks.length;
            }
            destTasks.splice(destIndex, 0, movedTask);
            
            const newColumns = {
                ...board.columns,
                [activeColumnId]: { ...activeColumn, tasks: sourceTasks },
                [overColumnId]: { ...overColumn, tasks: destTasks }
            };
            return { ...board, columns: newColumns };
        }
        return board;
    });
  };
  
  const handleOpenAddModal = useCallback((columnId: string) => {
    setModalState({ isOpen: true, mode: 'add', columnId });
  }, []);
  
  const handleOpenEditModal = useCallback((task: Task) => {
      const columnId = Object.values(board.columns).find(col => col.tasks.some(t => t.id === task.id))?.id;
      if (columnId) {
        setModalState({ isOpen: true, mode: 'edit', task, columnId });
      }
  }, [board.columns]);

  const handleCloseModal = useCallback(() => {
      setModalState({ isOpen: false, mode: 'add' });
  }, []);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
      setBoard(prev => {
          const newColumns = { ...prev.columns };
          for (const columnId in newColumns) {
              const column = newColumns[columnId];
              const taskIndex = column.tasks.findIndex(t => t.id === updatedTask.id);
              if (taskIndex > -1) {
                  const newTasks = [...column.tasks];
                  newTasks[taskIndex] = updatedTask;
                  newColumns[columnId] = { ...column, tasks: newTasks };
                  break; 
              }
          }
          return { ...prev, columns: newColumns };
      });
  }, []);

  const handleSaveTask = useCallback((taskData: Omit<Task, 'id'>) => {
    if (modalState.mode === 'add' && modalState.columnId) {
        const newTask: Task = { ...taskData, id: `task-${Date.now()}`};
        setBoard(prev => {
            const column = prev.columns[modalState.columnId as string];
            const updatedTasks = [...column.tasks, newTask];
            const updatedColumn: Column = { ...column, tasks: updatedTasks };
            return {...prev, columns: {...prev.columns, [modalState.columnId as string]: updatedColumn }};
        });
    } else if (modalState.mode === 'edit' && modalState.task) {
        const updatedTask = { ...modalState.task, ...taskData };
        handleUpdateTask(updatedTask);
    }
  }, [modalState, handleUpdateTask]);

 const handleDeleteTask = useCallback((taskId: string) => {
    setBoard(prevBoard => {
        const newColumns = { ...prevBoard.columns };
        for (const columnId in newColumns) {
            if (newColumns[columnId].tasks.some(task => task.id === taskId)) {
                newColumns[columnId] = {
                    ...newColumns[columnId],
                    tasks: newColumns[columnId].tasks.filter(task => task.id !== taskId),
                };
                break;
            }
        }
        handleCloseModal();
        return { ...prevBoard, columns: newColumns };
    });
}, [handleCloseModal]);

  const handleAddColumn = useCallback(() => {
      const newColumnId = `col-${Date.now()}`;
      const newColumn: Column = {
          id: newColumnId,
          title: "New Column",
          tasks: [],
      };
      setBoard(prev => ({
          ...prev,
          columnOrder: [...prev.columnOrder, newColumnId],
          columns: { ...prev.columns, [newColumnId]: newColumn },
      }));
  }, []);
  
  const handleRenameColumn = useCallback((columnId: string, newTitle: string) => {
    setBoard(prev => ({
        ...prev,
        columns: {
            ...prev.columns,
            [columnId]: { ...prev.columns[columnId], title: newTitle },
        },
    }));
  }, []);

  const handleDeleteColumn = useCallback((columnId: string) => {
    setBoard(prevBoard => {
      const newColumnOrder = prevBoard.columnOrder.filter(id => id !== columnId);
      const { [columnId]: _deletedColumn, ...restColumns } = prevBoard.columns;
      return {
          ...prevBoard,
          columnOrder: newColumnOrder,
          columns: restColumns,
      };
    });
  }, []);

  const resetBoard = useCallback(() => {
    setBoard(getInitialData());
  }, []);
  
  const handleSaveToFile = useCallback(() => {
      const boardJson = JSON.stringify(board, null, 2);
      const blob = new Blob([boardJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mini-loop-board.json';
      a.click();
      URL.revokeObjectURL(url);
  }, [board]);
  
  const handleLoadFromFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text === 'string') {
                  const loadedBoard = JSON.parse(text);
                  if (loadedBoard.columns && loadedBoard.columnOrder) {
                      setBoard(loadedBoard);
                  } else {
                      alert('Invalid board file format.');
                  }
              }
          } catch (error) {
              console.error("Failed to parse board file", error);
              alert('Failed to load board file. It may be corrupted.');
          }
      };
      reader.readAsText(file);
      if(event.target) event.target.value = '';
  }, []);

  const headerButtonStyle = {
    ...styles.iconButton,
    border: `1px solid`,
    backgroundColor: 'var(--bg-surface-raised)',
    color: 'var(--text-tertiary)',
    borderColor: 'var(--border-default)', // Use grayscale border for default state
  };

  return (
    <div style={styles.app}>
        <header style={{...styles.header, ...(isMobile && { padding: '8px 16px' })}}>
            <div style={{...styles.headerTitle, gap: '8px'}}>
                <Icon name="squares-four" weight="fill" size={22} style={{ color: 'var(--text-secondary)' }} />
                <span>Mini Loop</span>
            </div>
            <div style={styles.headerActions}>
                <motion.button 
                    title="Save Board" 
                    onClick={handleSaveToFile} 
                    style={headerButtonStyle} 
                    whileHover={!canHover ? {} : {
                        color: 'var(--accent-blue)',
                        borderColor: 'var(--accent-blue)',
                        boxShadow: '0 0 8px var(--accent-blue), 0 0 16px var(--accent-blue)',
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
                >
                    <Icon name="floppy-disk" size={18} />
                </motion.button>
                 <input type="file" accept=".json" ref={fileInputRef} onChange={handleLoadFromFile} style={{ display: 'none' }} />
                <motion.button 
                    title="Load Board" 
                    onClick={() => fileInputRef.current?.click()} 
                    style={headerButtonStyle} 
                    whileHover={!canHover ? {} : {
                        color: 'var(--priority-medium)',
                        borderColor: 'var(--priority-medium)',
                        boxShadow: '0 0 8px var(--priority-medium), 0 0 16px var(--priority-medium)',
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
                >
                    <Icon name="folder-open" size={18} />
                </motion.button>
                <motion.button 
                    title="Reset Board" 
                    onClick={resetBoard} 
                    style={headerButtonStyle} 
                    whileHover={!canHover ? {} : {
                        color: 'var(--danger)',
                        borderColor: 'var(--danger)',
                        boxShadow: '0 0 8px var(--danger), 0 0 16px var(--danger)',
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
                >
                    <Icon name="arrow-clockwise" size={18} />
                </motion.button>
            </div>
        </header>

        <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveItem(null)}
        >
            <div style={{
                ...styles.boardContainer,
                ...(isMobile && {
                    flexDirection: 'column',
                    padding: '16px',
                    gap: '16px',
                    alignItems: 'stretch',
                    overflowX: 'hidden',
                    overflowY: 'auto'
                })
            }}>
                <SortableContext items={board.columnOrder} strategy={isMobile ? verticalListSortingStrategy : horizontalListSortingStrategy}>
                    {board.columnOrder.map(columnId => {
                        const column = board.columns[columnId];
                        return (
                            <ColumnComponent
                                key={column.id}
                                column={column}
                                onUpdateTask={handleUpdateTask}
                                onEditTask={handleOpenEditModal}
                                onAddTask={() => handleOpenAddModal(column.id)}
                                onDeleteColumn={handleDeleteColumn}
                                onRenameColumn={(newTitle) => handleRenameColumn(column.id, newTitle)}
                                isMobile={isMobile}
                            />
                        );
                    })}
                </SortableContext>
                 <motion.button style={{
                    ...styles.addColumnButton,
                    ...(isMobile && { width: '100%', minWidth: 'unset' })
                  }} 
                  onClick={handleAddColumn}
                  whileHover={!canHover ? {} : { 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                    borderColor: 'var(--accent-primary)',
                    color: 'var(--text-primary)',
                    scale: 1.02
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    <motion.div whileHover={!canHover ? {} : { rotate: 90 }}>
                        <Icon name="plus" weight="bold" size={16} />
                    </motion.div>
                    Add Another Column
                </motion.button>
            </div>
             <DragOverlay>
                {activeItem ? (
                    'tasks' in activeItem ? (
                        <ColumnComponent
                            column={activeItem as Column}
                            onAddTask={() => {}}
                            onEditTask={() => {}}
                            onUpdateTask={() => {}}
                            onDeleteColumn={() => {}}
                            onRenameColumn={() => {}}
                            isDragOverlay
                            isMobile={isMobile}
                        />
                    ) : (
                        <TaskCard
                            task={activeItem as Task}
                            onUpdateTask={() => {}}
                            onEdit={() => {}}
                            isDragOverlay
                        />
                    )
                ) : null}
            </DragOverlay>
        </DndContext>

        <TaskModal 
            isOpen={modalState.isOpen}
            onClose={handleCloseModal}
            onSave={handleSaveTask}
            onDelete={handleDeleteTask}
            taskToEdit={modalState.task}
        />
    </div>
  );
}

export default App;