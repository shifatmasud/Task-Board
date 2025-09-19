import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, Subtask, Comment } from '../types';
import { Priority } from '../types';
import { styles } from '../style';
import Icon from './Icon';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id'>) => void;
  onDelete?: () => void;
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
      if (onDelete && window.confirm("Are you sure you want to delete this task? This cannot be undone.")) {
          onDelete();
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

export default TaskModal;