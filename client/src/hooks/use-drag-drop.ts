import { useState, useCallback } from 'react';
import type { Activity } from '@shared/schema';

interface DragDropState {
  draggedActivity: Activity | null;
  dragOverSlot: { dayOfWeek: number; timeSlot: number } | null;
  isDragging: boolean;
}

interface UseDragDropReturn {
  draggedActivity: Activity | null;
  dragOverSlot: { dayOfWeek: number; timeSlot: number } | null;
  isDragging: boolean;
  handleDragStart: (activity: Activity) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, dayOfWeek: number, timeSlot: number) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, dayOfWeek: number, timeSlot: number) => void;
}

interface DragDropOptions {
  onActivityDrop?: (activity: Activity, dayOfWeek: number, timeSlot: number) => void;
  onActivityRemove?: (dayOfWeek: number, timeSlot: number) => void;
}

export function useDragDrop({ onActivityDrop, onActivityRemove }: DragDropOptions = {}): UseDragDropReturn {
  const [state, setState] = useState<DragDropState>({
    draggedActivity: null,
    dragOverSlot: null,
    isDragging: false,
  });

  const handleDragStart = useCallback((activity: Activity) => {
    setState(prev => ({
      ...prev,
      draggedActivity: activity,
      isDragging: true,
    }));
  }, []);

  const handleDragEnd = useCallback(() => {
    setState(prev => ({
      ...prev,
      draggedActivity: null,
      dragOverSlot: null,
      isDragging: false,
    }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayOfWeek: number, timeSlot: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.add("drag-over");
    
    setState(prev => ({
      ...prev,
      dragOverSlot: { dayOfWeek, timeSlot },
    }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const dropZone = e.currentTarget as HTMLElement;
    const rect = dropZone.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Only remove drag-over class if mouse truly left the element
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      dropZone.classList.remove("drag-over");
      setState(prev => ({
        ...prev,
        dragOverSlot: null,
      }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dayOfWeek: number, timeSlot: number) => {
    e.preventDefault();
    
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.classList.remove("drag-over");
    
    if (state.draggedActivity && onActivityDrop) {
      onActivityDrop(state.draggedActivity, dayOfWeek, timeSlot);
    }
    
    setState(prev => ({
      ...prev,
      draggedActivity: null,
      dragOverSlot: null,
      isDragging: false,
    }));
  }, [state.draggedActivity, onActivityDrop]);

  return {
    draggedActivity: state.draggedActivity,
    dragOverSlot: state.dragOverSlot,
    isDragging: state.isDragging,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}

export default useDragDrop;
