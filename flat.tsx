import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  useDroppable
} from 'https://aistudiocdn.com/@dnd-kit/core';

import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable
} from 'https://aistudiocdn.com/@dnd-kit/sortable';

import { CSS } from 'https://aistudiocdn.com/@dnd-kit/utilities';


// Global CSS from index.html
const globalStyles = `
  :root {
    --bg-base: #0A0A0A;
    --bg-surface: #141414;
    --bg-surface-raised: #1A1A1A;
    --bg-surface-overlay: #222222;
    --bg-surface-hover: #282828;
    
    --text-primary: #E0E0E0;
    --text-secondary: #9E9E9E;
    --text-tertiary: #616161;
    
    --border-default: #2A2A2A;
    --border-subtle: #1F1F1F;
    
    --accent-primary: #B0B0B0;
    --accent-primary-hover: #FFFFFF;
    --text-on-accent: #121212;
    --accent-blue: #64b5f6;

    --danger: #e57373;
    --danger-hover: #ef5350;

    --priority-high: #e57373;
    --priority-medium: #f2c94c;
    --priority-low: #81c784;
    --priority-none: #616161;

    --shadow-sm: 0 1px 2px rgba(0,0,0,0.7), 0 0 4px rgba(200, 200, 200, 0.03);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.7), 0 2px 4px -1px rgba(0,0,0,0.6), 0 0 10px rgba(200, 200, 200, 0.03);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.8), 0 4px 6px -2px rgba(0,0,0,0.7), 0 0 20px rgba(200, 200, 200, 0.05);
    --shadow-glow: 0 0 15px rgba(176, 176, 176, 0.25), 0 0 25px rgba(176, 176, 176, 0.15);

    --border-radius-sm: 4px;
    --border-radius-md: 6px;
    --border-radius-lg: 8px;
  }
  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background-color: var(--bg-base);
    color: var(--text-primary);
    overflow: auto;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    user-select: none;
  }
  * {
    box-sizing: border-box;
  }
  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  ::-webkit-scrollbar-track {
    background: var(--bg-base);
  }
  ::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 5px;
    border: 2px solid var(--bg-base);
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #444;
  }
  
  /* Minimal Input Focus */
  input:focus, textarea:focus, select:focus {
    border-color: var(--accent-primary) !important;
    box-shadow: 0 0 0 2px rgba(176, 176, 176, 0.1), 0 0 5px rgba(176, 176, 176, 0.3);
  }
  
  /* Task Card Cursor Tracker Effect */
  .task-card-interactive-hover::before {
    content: '';
    position: absolute;
    top: var(--cursor-y, 50%);
    left: var(--cursor-x, 50%);
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    opacity: 0;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.07) 0%, transparent 60%);
    border-radius: 50%;
    transition: width 0.3s ease-out, height 0.3s ease-out, opacity 0.3s ease-out;
    pointer-events: none;
  }
  .task-card-interactive-hover:hover::before {
    width: 350px;
    height: 350px;
    opacity: 1;
  }

  /* Glow Animations */
  @keyframes subtle-glow-red {
    0%, 100% { box-shadow: 0 0 4px var(--priority-high), 0 0 8px var(--priority-high); }
    50% { box-shadow: 0 0 8px var(--priority-high), 0 0 16px var(--priority-high); }
  }
  @keyframes subtle-glow-yellow {
    0%, 100% { box-shadow: 0 0 4px var(--priority-medium), 0 0 8px var(--priority-medium); }
    50% { box-shadow: 0 0 8px var(--priority-medium), 0 0 16px var(--priority-medium); }
  }
  @keyframes subtle-glow-green {
    0%, 100% { box-shadow: 0 0 4px var(--priority-low), 0 0 8px var(--priority-low); }
    50% { box-shadow: 0 0 8px var(--priority-low), 0 0 16px var(--priority-low); }
  }
  @keyframes subtle-glow-blue {
    0%, 100% { box-shadow: 0 0 4px var(--accent-blue), 0 0 8px var(--accent-blue); }
    50% { box-shadow: 0 0 8px var(--accent-blue), 0 0 16px var(--accent-blue); }
  }
`;

// Type Definitions
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


// Style Definitions
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

const styles: { [key: string]: React.CSSProperties | { [key: string]: React.CSSProperties } } = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-base)',
  },
  header: {
    ...mixins.flexBetween,
    padding: '8px 24px',
    backgroundColor: 'var(--bg-base)',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  },
  inlineEditInput: {
    width: '100%',
    padding: '2px 4px',
    margin: '-3px -5px',
    backgroundColor: 'var(--bg-surface)',
    border: `1px solid var(--accent-primary)`,
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-primary)',
    outline: 'none',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  boardContainer: {
    display: 'flex',
    flexGrow: 1,
    padding: '24px 32px',
    gap: '24px',
    overflowX: 'auto',
    alignItems: 'flex-start',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    width: '320px',
    minWidth: '320px',
    backgroundColor: 'var(--bg-surface)',
    borderRadius: 'var(--border-radius-lg)',
    transition: 'opacity 0.2s, box-shadow 0.2s',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-subtle)',
  },
  columnDragging: {
      boxShadow: `var(--shadow-lg), var(--shadow-glow)`,
  },
  columnHeader: {
    ...mixins.flexBetween,
    padding: '12px 16px 12px 16px',
    cursor: 'grab',
    borderTopLeftRadius: 'calc(var(--border-radius-lg) - 1px)',
    borderTopRightRadius: 'calc(var(--border-radius-lg) - 1px)',
    transition: 'background-color 0.2s ease-in-out',
  },
  columnHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  columnTitle: {
    fontSize: '1rem',
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  taskCount: {
    ...mixins.flexCenter,
    backgroundColor: 'var(--bg-base)',
    color: 'var(--text-secondary)',
    padding: '0 8px',
    height: '22px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexGrow: 1,
    padding: '0 8px 8px 8px',
    minHeight: '100px',
  },
  taskCard: {
    backgroundColor: 'var(--bg-surface-raised)',
    borderRadius: 'var(--border-radius-md)',
    border: `1px solid var(--border-subtle)`,
    transition: 'background-color 0.2s, border-color 0.2s, opacity 0.2s',
    display: 'flex',
    position: 'relative',
    overflow: 'visible',
    gap: '8px',
    alignItems: 'flex-start',
    cursor: 'grab',
    padding: '12px',
    boxShadow: 'var(--shadow-sm)',
  },
  taskCardDragging: {
    boxShadow: `var(--shadow-lg), var(--shadow-glow)`,
    transform: 'rotate(2deg) scale(1.03)',
  },
  taskCardContent: {
    flexGrow: 1,
    padding: '0 4px',
  },
  taskTitle: {
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: '8px',
    fontSize: '0.9rem',
    paddingRight: '24px', // Space for edit button
  },
  taskFooter: {
    ...mixins.flexBetween,
    marginTop: '12px',
  },
  priorityIndicator: {
    width: '4px',
    borderRadius: '2px',
    alignSelf: 'stretch',
    flexShrink: 0,
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
    top: '4px',
    right: '4px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    width: '36px',
    height: '36px',
    padding: '0',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, color 0.2s',
    opacity: 1,
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
    fontSize: '0.85rem',
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
  progressBarContainer: {
    height: '6px',
    width: '100%',
    backgroundColor: 'var(--bg-base)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '12px',
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: 'var(--accent-primary)',
      borderRadius: '3px',
      transition: 'width 0.3s ease-in-out',
  },
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
    userSelect: 'text',
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
    padding: '10px 12px',
    backgroundColor: 'var(--bg-base)',
    border: `1px solid var(--border-default)`,
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'var(--bg-base)',
    border: `1px solid var(--border-default)`,
    borderRadius: 'var(--border-radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    minHeight: '120px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  button: {
    padding: '8px 16px',
    borderRadius: 'var(--border-radius-md)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
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
    backgroundColor: 'var(--bg-surface-raised)',
    color: 'var(--text-primary)',
    border: `1px solid var(--border-default)`,
  },
  buttonDanger: {
    backgroundColor: 'transparent',
    color: 'var(--danger)',
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    width: '44px',
    height: '44px',
    padding: '0',
    borderRadius: 'var(--border-radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s, color 0.2s',
  },
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
    backgroundColor: 'var(--bg-base)',
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
    width: '320px',
    minWidth: '320px',
    padding: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: `1px solid var(--border-default)`,
    borderRadius: 'var(--border-radius-lg)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
    height: 'fit-content',
  },
};

const getPriorityIndicatorStyle = (priority: Priority): React.CSSProperties => {
  switch (priority) {
    case Priority.High:
      return { backgroundColor: 'var(--priority-high)', animation: 'subtle-glow-red 2.5s ease-in-out infinite' };
    case Priority.Medium:
      return { backgroundColor: 'var(--priority-medium)', animation: 'subtle-glow-yellow 2.5s ease-in-out infinite' };
    case Priority.Low:
      return { backgroundColor: 'var(--priority-low)', animation: 'subtle-glow-green 2.5s ease-in-out infinite' };
    default:
      return { backgroundColor: 'var(--priority-none)' };
  }
};


// Helper Hooks
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

// Initial Data
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


// Components
interface IconProps {
  name: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  size?: number;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ name, weight = 'regular', size = 18, style, onClick }) => {
  const weightClass = weight === 'regular' ? 'ph' : `ph-${weight}`;
  const nameClass = `ph-${name}`;
  const className = `${weightClass} ${nameClass}`;
  
  const combinedStyle = {
    ...style,
    fontSize: `${size}px`,
  };

  return <i className={className} style={combinedStyle} onClick={onClick}></i>;
};


interface AnimatedCounterProps {
  value: number;
  fontSize?: number;
  style?: React.CSSProperties;
}

const Digit: React.FC<{ value: number; height: number; }> = ({ value, height }) => {
  return (
    <motion.div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      animate={{ y: -value * height }}
      transition={{ type: 'tween', duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {[...Array(10).keys()].map(i => (
        <span key={i} style={{ height: `${height}px`, lineHeight: `${height}px` }}>{i}</span>
      ))}
    </motion.div>
  );
};

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, fontSize = 12, style }) => {
  const digits = String(value).split('').map(Number);
  const height = fontSize;

  return (
    <div style={{ 
      display: 'flex', 
      overflow: 'hidden', 
      height: `${height}px`,
      fontSize: `${fontSize}px`,
      lineHeight: `${height}px`,
      ...style 
    }}>
      {digits.map((digit, index) => (
        <div key={index} style={{height: `${height}px`}}>
            <Digit value={digit} height={height} />
        </div>
      ))}
    </div>
  );
};


const particleColors = ['var(--danger)', 'var(--accent-blue)', 'var(--priority-low)', 'var(--priority-medium)'];
const numParticles = 60;

const Particle: React.FC = () => {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 250 + 80;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const color = particleColors[Math.floor(Math.random() * particleColors.length)];
  const size = Math.random() * 12 + 6;
  const delay = Math.random() * 0.4;
  const duration = Math.random() * 1.0 + 0.8;

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`,
      }}
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0.5],
        x: x,
        y: y,
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: 'easeOut',
      }}
    />
  );
};

const EasterEggMessage: React.FC = () => {
    return (
        <motion.div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
                pointerEvents: 'none',
                backgroundColor: 'rgba(10, 10, 10, 0.75)',
                backdropFilter: 'blur(12px) saturate(120%)',
                WebkitBackdropFilter: 'blur(12px) saturate(120%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.h1
                style={{
                    fontSize: 'clamp(2rem, 8vw, 4rem)',
                    color: 'var(--text-primary)',
                    textShadow: '0 0 10px white, 0 0 20px white, 0 0 30px #e60073, 0 0 40px #e60073',
                    zIndex: 2,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200, damping: 15 } }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
            >
                Take Love ❤
            </motion.h1>
            <div style={{ position: 'absolute', zIndex: 1 }}>
                {[...Array(numParticles)].map((_, i) => (
                    <Particle key={i} />
                ))}
            </div>
        </motion.div>
    );
};


interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id'>) => void;
  onDelete?: (taskId: string) => void;
  taskToEdit?: Task | null;
}

const SubtaskInputRow: React.FC<{ 
    index: number, 
    subtask: { text: string, completed: boolean }, 
    onChange: (index: number, value: string) => void, 
    onToggle: (index: number) => void,
    onRemove: (index: number) => void 
}> = ({ index, subtask, onChange, onToggle, onRemove }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div 
            style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                style={{ ...styles.checkbox, ...(subtask.completed ? styles.checkboxChecked : {}) }} 
                onClick={() => onToggle(index)}
                role="checkbox"
                aria-checked={subtask.completed}
            >
              {subtask.completed && <Icon name="check" weight="bold" size={12} style={{ color: 'var(--text-on-accent)' }} />}
            </div>
            <input 
                style={{ ...styles.input, flexGrow: 1, textDecoration: subtask.completed ? 'line-through' : 'none', color: subtask.completed ? 'var(--text-tertiary)' : 'var(--text-primary)' }} 
                type="text"
                placeholder={`Subtask ${index + 1}`}
                value={subtask.text}
                onChange={(e) => onChange(index, e.target.value)}
            />
            <button type="button" style={{ ...styles.iconButton, color: isHovered ? 'var(--danger)' : 'var(--text-tertiary)' }} onClick={() => onRemove(index)}>
                <Icon name="trash" size={18} />
            </button>
        </div>
    );
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, taskToEdit }) => {
  const isEditMode = !!taskToEdit;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.None);
  const [subtasks, setSubtasks] = useState<{ id?: string; text: string; completed: boolean }[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const resetState = () => {
    setTitle('');
    setDescription('');
    setPriority(Priority.None);
    setSubtasks([]);
    setComments([]);
    setNewComment('');
  };
  
  useEffect(() => {
    if (isOpen) {
        if (isEditMode && taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description || '');
            setPriority(taskToEdit.priority);
            setSubtasks([...taskToEdit.subtasks]);
            setComments([...taskToEdit.comments]);
        } else {
            resetState();
        }
    }
  }, [isOpen, isEditMode, taskToEdit]);

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { text: '', completed: false, id: `new-${Date.now()}` }]);
  };

  const handleSubtaskChange = (index: number, value: string) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].text = value;
    setSubtasks(newSubtasks);
  };
  
  const handleSubtaskToggle = (index: number) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index].completed = !newSubtasks[index].completed;
    setSubtasks(newSubtasks);
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };
  
  const handleAddComment = () => {
      if (!newComment.trim()) return;
      const comment: Comment = {
          id: `comment-${Date.now()}`,
          text: newComment,
          timestamp: new Date().toISOString(),
      };
      setComments([...comments, comment]);
      setNewComment('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title,
      description,
      priority,
      subtasks: subtasks
        .filter(s => s.text.trim() !== '')
        .map((s, i) => ({ id: s.id?.startsWith('new-') ? `subtask-${Date.now()}-${i}` : s.id || `subtask-${Date.now()}-${i}`, text: s.text, completed: s.completed })),
      comments,
    });
    onClose();
  };
  
  const handleDelete = () => {
      if (onDelete && taskToEdit) {
          onDelete(taskToEdit.id);
      }
  }
  
  const formatTimestamp = (isoString: string) => {
      return new Date(isoString).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short'
      });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={styles.modalBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            style={styles.modalContent}
            initial={{ y: -30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{isEditMode ? 'Edit Task' : 'Add New Task'}</h2>
              <button style={styles.iconButton} onClick={onClose}>
                <Icon name="x" size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="title">Task Title</label>
                  <input style={styles.input} type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="description">Description (Optional)</label>
                  <textarea style={styles.textarea} id="description" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="priority">Priority</label>
                  <select style={styles.input} id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Subtasks</label>
                    {subtasks.map((subtask, index) => (
                        <SubtaskInputRow 
                            key={subtask.id || index}
                            index={index} 
                            subtask={subtask}
                            onChange={handleSubtaskChange}
                            onToggle={handleSubtaskToggle}
                            onRemove={handleRemoveSubtask}
                        />
                    ))}
                    <button type="button" style={{ ...styles.button, ...styles.buttonSecondary, marginTop: '8px' }} onClick={handleAddSubtask}>
                        <Icon name="plus" size={16} />
                        Add Subtask
                    </button>
                </div>
                
                {isEditMode && (
                    <div style={styles.commentSection}>
                        <label style={styles.label}>Comments</label>
                        <div style={styles.commentList}>
                            {comments.length === 0 && <span style={{color: 'var(--text-tertiary)', fontSize: '0.9rem', padding: '8px', textAlign: 'center'}}>No comments yet.</span>}
                            {comments.map(comment => (
                                <div key={comment.id} style={styles.comment}>
                                    <p style={{margin: 0}}>{comment.text}</p>
                                    <span style={styles.commentTimestamp}>{formatTimestamp(comment.timestamp)}</span>
                                </div>
                            ))}
                        </div>
                        <div style={styles.commentInputArea}>
                            <input
                                style={{ ...styles.input, flexGrow: 1 }}
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); }}}
                            />
                            <button type="button" style={{ ...styles.button, ...styles.buttonPrimary }} onClick={handleAddComment}>Post</button>
                        </div>
                    </div>
                )}
              </div>

              <div style={styles.modalActions}>
                <div>
                    {isEditMode && onDelete && (
                        <button type="button" style={{...styles.button, ...styles.buttonDanger}} onClick={handleDelete}>
                            <Icon name="trash" size={16}/> Delete Task
                        </button>
                    )}
                </div>
                <div style={{display: 'flex', gap: '12px'}}>
                    <button type="button" style={{ ...styles.button, ...styles.buttonSecondary }} onClick={onClose}>Cancel</button>
                    <button type="submit" style={{ ...styles.button, ...styles.buttonPrimary }}>
                        {isEditMode ? 'Save Changes' : 'Add Task'}
                    </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


interface TaskCardProps {
  task: Task;
  onUpdateTask: (updatedTask: Task) => void;
  onEdit: () => void;
  isDragOverlay?: boolean;
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

const SubtaskItem: React.FC<{subtask: Subtask, onToggle: () => void, canHover: boolean}> = ({subtask, onToggle, canHover}) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
         <div 
            style={{...styles.subtask, ...(isHovered && canHover ? styles.subtaskHover : {})}}
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
    if (!element || isDragOverlay || !canHover) return;

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
  }, [isDragOverlay, canHover]);


  const dndTransform = CSS.Transform.toString(transform);

  const style: React.CSSProperties = {
    ...styles.taskCard,
    transition,
    transform: dndTransform,
    zIndex: isDragging ? 10 : 'auto',
  };
  
  if (isDragging) {
    style.opacity = 0;
  }

  if (isDragOverlay) {
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
      className={!isDragOverlay && canHover ? 'task-card-interactive-hover' : ''}
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
                >{task.title}</h3>
            )}
            
            {task.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 12px 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{task.description}</p>}

            {totalSubtasks > 0 && (
                <div style={styles.checklist}>
                {task.subtasks.map(subtask => (
                    <SubtaskItem key={subtask.id} subtask={subtask} onToggle={() => handleSubtaskToggle(subtask.id)} canHover={canHover} />
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
         {(isHovered || !canHover) && (
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


interface ColumnProps {
  column: Column;
  onUpdateTask: (updatedTask: Task) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (newTitle: string) => void;
  isDragOverlay?: boolean;
  isMobile?: boolean;
}

const ColumnComponent: React.FC<ColumnProps> = ({ column, onUpdateTask, onAddTask, onEditTask, onDeleteColumn, onRenameColumn, isDragOverlay = false, isMobile = false }) => {
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
    style.opacity = 0.4;
  }
  
  if (isDragOverlay) {
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


// Main App Component
export default function New(props: {}) {
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
  
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const headerClicks = useRef<number[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('kanbanBoardState', JSON.stringify(board));
    } catch (error) {
      console.error("Could not save board state to local storage", error);
    }
  }, [board]);
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleHeaderClick = useCallback(() => {
    const now = Date.now();
    const recentClicks = headerClicks.current.filter(t => now - t < 700);
    recentClicks.push(now);
    headerClicks.current = recentClicks;

    if (recentClicks.length >= 3) {
        setShowEasterEgg(true);
        headerClicks.current = [];
        setTimeout(() => {
            setShowEasterEgg(false);
        }, 3000);
    }
  }, []);
  
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
    borderColor: 'var(--border-default)',
  };

  return (
    <>
        <style>{globalStyles}</style>
        <div style={styles.app}>
            <header style={{...styles.header, ...(isMobile && { padding: '8px 16px' })}} onClick={handleHeaderClick}>
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
            <AnimatePresence>
                {showEasterEgg && <EasterEggMessage />}
            </AnimatePresence>
        </div>
    </>
  );
}
