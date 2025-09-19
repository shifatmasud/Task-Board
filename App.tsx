

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
import { arrayMove, sortableKeyboardCoordinates, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

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

// Custom hook to handle proximity glow effect
const useProximityGlow = (ref: React.RefObject<HTMLButtonElement>, glowColor: string) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2)) + 50; 
      const opacity = Math.max(0, 1 - distance / maxDistance);

      element.style.setProperty('--glow-x', `${x}px`);
      element.style.setProperty('--glow-y', `${y}px`);
      element.style.setProperty('--glow-color', glowColor);
      element.style.setProperty('--glow-opacity', `${opacity * 0.6}`);
    };

    const handleMouseLeave = () => {
      element.style.setProperty('--glow-opacity', '0');
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, glowColor]);
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
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const loadButtonRef = useRef<HTMLButtonElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);

  useProximityGlow(saveButtonRef, 'var(--accent-blue)');
  useProximityGlow(loadButtonRef, 'var(--priority-medium)');
  useProximityGlow(resetButtonRef, 'var(--danger)');


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
    border: `1px solid var(--border-default)`,
    backgroundColor: 'var(--bg-surface-raised)'
  };

  const saveButtonStyle = {
    ...headerButtonStyle,
    color: 'var(--accent-blue)',
    borderColor: 'var(--accent-blue)',
  };

  const loadButtonStyle = {
    ...headerButtonStyle,
    color: 'var(--priority-medium)',
    borderColor: 'var(--priority-medium)',
  };

  const resetButtonStyle = {
    ...headerButtonStyle,
    color: 'var(--danger)',
    borderColor: 'var(--danger)',
  };

  return (
    <div style={styles.app}>
        <header style={styles.header}>
            <h1 style={styles.headerTitle}>
                <Icon name="squares-four" weight="fill" size={22} style={{ color: 'var(--accent-primary)' }} />
                Mini Loop
            </h1>
            <div style={styles.headerActions}>
                <button ref={saveButtonRef} title="Save Board" onClick={handleSaveToFile} style={saveButtonStyle} className="proximity-glow-button">
                    <Icon name="floppy-disk" size={18} />
                </button>
                 <input type="file" accept=".json" ref={fileInputRef} onChange={handleLoadFromFile} style={{ display: 'none' }} />
                <button ref={loadButtonRef} title="Load Board" onClick={() => fileInputRef.current?.click()} style={loadButtonStyle} className="proximity-glow-button">
                    <Icon name="folder-open" size={18} />
                </button>
                <button ref={resetButtonRef} title="Reset Board" onClick={resetBoard} style={resetButtonStyle} className="proximity-glow-button">
                    <Icon name="arrow-clockwise" size={18} />
                </button>
            </div>
        </header>

        <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveItem(null)}
        >
            <div style={styles.boardContainer}>
                <SortableContext items={board.columnOrder} strategy={horizontalListSortingStrategy}>
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
                            />
                        );
                    })}
                </SortableContext>
                 <button style={styles.addColumnButton} onClick={handleAddColumn}>
                    <Icon name="plus" weight="bold" size={16} />
                    Add Another Column
                </button>
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
