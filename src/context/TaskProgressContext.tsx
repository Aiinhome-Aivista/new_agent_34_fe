import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { apiClient } from '../api/client';

export type TaskType = 'batch_ingest' | 'document_upload';
export type TaskStatus = 'idle' | 'running' | 'completed' | 'error';

export interface IngestionTask {
  id: string;
  type: TaskType;
  title: string;
  status: TaskStatus;
  progress: number; // 0 to 100
  current: number;
  total: number;
  unit: string; // 'records' | 'chunks'
  message: string;
  itemId?: string;
  startTime: number;
  completedTime?: number;
  result?: any;
  error?: string;
}

export interface DocumentUploadMetadata {
  document_key: string;
  title: string;
  category: string;
  action_impact: string;
  version: string;
  description: string;
}

interface TaskProgressContextType {
  activeTask: IngestionTask | null;
  taskHistory: IngestionTask[];
  isDockMinimized: boolean;
  setIsDockMinimized: (minimized: boolean) => void;
  isDockVisible: boolean;
  setIsDockVisible: (visible: boolean) => void;
  startBatchIngest: (file: File, autoInvestigate: boolean) => Promise<any>;
  startDocumentUpload: (file: File, metadata: DocumentUploadMetadata) => Promise<any>;
  dismissTask: (taskId?: string) => void;
  latestBatchResult: any | null;
  setLatestBatchResult: (res: any | null) => void;
  latestDocResult: any | null;
  setLatestDocResult: (res: any | null) => void;
  navigateToTab?: (tab: string, caseId?: string) => void;
}

const TaskProgressContext = createContext<TaskProgressContextType | undefined>(undefined);

export const TaskProgressProvider: React.FC<{
  children: React.ReactNode;
  onNavigate?: (tab: string, caseId?: string) => void;
}> = ({ children, onNavigate }) => {
  const [activeTask, setActiveTask] = useState<IngestionTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<IngestionTask[]>([]);
  const [isDockMinimized, setIsDockMinimized] = useState<boolean>(false);
  const [isDockVisible, setIsDockVisible] = useState<boolean>(false);

  const [latestBatchResult, setLatestBatchResult] = useState<any | null>(null);
  const [latestDocResult, setLatestDocResult] = useState<any | null>(null);

  const activeTaskRef = useRef<IngestionTask | null>(null);
  activeTaskRef.current = activeTask;

  // Dismiss a task from dock
  const dismissTask = useCallback((taskId?: string) => {
    if (!taskId || activeTaskRef.current?.id === taskId) {
      setIsDockVisible(false);
      // Keep in history, but clear active
      if (activeTaskRef.current) {
        setTaskHistory((prev) => [activeTaskRef.current!, ...prev.filter((t) => t.id !== activeTaskRef.current!.id)]);
      }
      setTimeout(() => {
        setActiveTask(null);
      }, 300);
    }
  }, []);

  // 1. Batch Excel/CSV Ingestion Flow
  const startBatchIngest = useCallback(
    async (file: File, autoInvestigate: boolean): Promise<any> => {
      const taskId = `batch_${Date.now()}`;
      const newTask: IngestionTask = {
        id: taskId,
        type: 'batch_ingest',
        title: file.name,
        status: 'running',
        progress: 8,
        current: 0,
        total: 0,
        unit: 'records',
        message: `Uploading and parsing ${file.name}...`,
        startTime: Date.now(),
      };

      setActiveTask(newTask);
      setIsDockVisible(true);
      setIsDockMinimized(false);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('auto_investigate', autoInvestigate.toString());

      try {
        const result = await apiClient.uploadBatchFileStream(formData, (update) => {
          setActiveTask((prev) => {
            if (!prev || prev.id !== taskId) return prev;
            const current = update.current !== undefined ? update.current : prev.current;
            const total = update.total !== undefined ? update.total : prev.total;
            const percent = update.percent !== undefined ? update.percent : prev.progress;
            const message = update.message || prev.message;
            const itemId = update.item_id || prev.itemId;

            return {
              ...prev,
              progress: percent,
              current,
              total,
              message,
              itemId,
            };
          });
        });

        const totalRows = result.total_rows || result.ingested || 0;
        const casesCount = result.triggered_cases?.length || 0;
        const completionMessage = `Ingestion complete! ${result.ingested || totalRows} records processed, ${casesCount} cases created.`;

        const completedTask: IngestionTask = {
          ...newTask,
          status: 'completed',
          progress: 100,
          current: totalRows,
          total: totalRows,
          message: completionMessage,
          completedTime: Date.now(),
          result,
        };

        setActiveTask(completedTask);
        setLatestBatchResult(result);
        setTaskHistory((prev) => [completedTask, ...prev.filter((t) => t.id !== taskId)]);

        return result;
      } catch (err: any) {
        const errorMsg = err.message || 'Batch ingestion failed.';
        const failedTask: IngestionTask = {
          ...newTask,
          status: 'error',
          error: errorMsg,
          message: `Error: ${errorMsg}`,
          completedTime: Date.now(),
        };

        setActiveTask(failedTask);
        setTaskHistory((prev) => [failedTask, ...prev.filter((t) => t.id !== taskId)]);
        throw err;
      }
    },
    []
  );

  // 2. Private Knowledge Base Document Upload Flow
  const startDocumentUpload = useCallback(
    async (file: File, metadata: DocumentUploadMetadata): Promise<any> => {
      const taskId = `doc_${Date.now()}`;
      const newTask: IngestionTask = {
        id: taskId,
        type: 'document_upload',
        title: metadata.title || file.name,
        status: 'running',
        progress: 10,
        current: 0,
        total: 0,
        unit: 'chunks',
        message: `Extracting text from ${file.name}...`,
        startTime: Date.now(),
      };

      setActiveTask(newTask);
      setIsDockVisible(true);
      setIsDockMinimized(false);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_key', metadata.document_key.trim().toUpperCase());
      formData.append('title', metadata.title.trim());
      formData.append('category', metadata.category);
      formData.append('action_impact', metadata.action_impact);
      formData.append('version', metadata.version.trim() || '1.0');
      formData.append('description', metadata.description.trim());

      try {
        const result = await apiClient.uploadKnowledgeDocumentStream(formData, (update) => {
          setActiveTask((prev) => {
            if (!prev || prev.id !== taskId) return prev;
            const current = update.current !== undefined ? update.current : prev.current;
            const total = update.total !== undefined ? update.total : prev.total;
            const percent = update.percent !== undefined ? update.percent : prev.progress;
            const message = update.message || prev.message;
            const itemId = update.item_id || prev.itemId;

            return {
              ...prev,
              progress: percent,
              current,
              total,
              message,
              itemId,
            };
          });
        });

        const indexedChunks = result.chunks_indexed || 0;
        const completionMessage = `Indexed "${result.title || metadata.title}" (${indexedChunks} vector chunks in ChromaDB).`;

        const completedTask: IngestionTask = {
          ...newTask,
          status: 'completed',
          progress: 100,
          current: indexedChunks,
          total: indexedChunks,
          message: completionMessage,
          completedTime: Date.now(),
          result,
        };

        setActiveTask(completedTask);
        setLatestDocResult(result);
        setTaskHistory((prev) => [completedTask, ...prev.filter((t) => t.id !== taskId)]);

        return result;
      } catch (err: any) {
        const errorMsg = err.message || 'Document upload & vector indexing failed.';
        const failedTask: IngestionTask = {
          ...newTask,
          status: 'error',
          error: errorMsg,
          message: `Error: ${errorMsg}`,
          completedTime: Date.now(),
        };

        setActiveTask(failedTask);
        setTaskHistory((prev) => [failedTask, ...prev.filter((t) => t.id !== taskId)]);
        throw err;
      }
    },
    []
  );

  return (
    <TaskProgressContext.Provider
      value={{
        activeTask,
        taskHistory,
        isDockMinimized,
        setIsDockMinimized,
        isDockVisible,
        setIsDockVisible,
        startBatchIngest,
        startDocumentUpload,
        dismissTask,
        latestBatchResult,
        setLatestBatchResult,
        latestDocResult,
        setLatestDocResult,
        navigateToTab: onNavigate,
      }}
    >
      {children}
    </TaskProgressContext.Provider>
  );
};

export const useTaskProgress = () => {
  const context = useContext(TaskProgressContext);
  if (!context) {
    throw new Error('useTaskProgress must be used within a TaskProgressProvider');
  }
  return context;
};
