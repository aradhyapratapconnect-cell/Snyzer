import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnalysisPanel } from '../analysis/AnalysisPanel.js';
import { Button } from '../ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.js';
import { Skeleton } from '../ui/skeleton.js';
import { toast } from '../ui/toaster.js';
import { deleteWritingJob, getWritingJob, type HistoryJobDetail } from '../../api/history.js';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore.js';

/**
 * History detail dialog (SNZ-051).
 *
 * Fetches the full job (untruncated texts + metrics) on open, offers "Load
 * into Workspace" (copies the output back to the editor and navigates
 * there) and destructive deletion (calls the API, toasts, and notifies the
 * parent to drop the card without a refetch). Focus trap and Escape come
 * from the Dialog primitive.
 */
export function HistoryDetailModal({
  jobId,
  onClose,
  onDeleted,
}: {
  jobId: string | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const navigate = useNavigate();
  const setInputText = useWorkspaceStore((state) => state.setInputText);
  const [job, setJob] = useState<HistoryJobDetail | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (jobId === null) {
      return;
    }
    let live = true;
    setJob(null);
    setStatus('loading');
    void getWritingJob(jobId)
      .then((response) => {
        if (live) {
          setJob(response.job);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (live) {
          setStatus('error');
        }
      });
    return () => {
      live = false;
    };
  }, [jobId]);

  const handleDelete = async (): Promise<void> => {
    if (jobId === null || deleting) {
      return;
    }
    setDeleting(true);
    try {
      await deleteWritingJob(jobId);
      toast.success('Deleted from history.');
      onDeleted(jobId);
      onClose();
    } catch {
      toast.error('Could not delete this entry. Please try again.');
      setDeleting(false);
    }
  };

  const handleLoadIntoWorkspace = (): void => {
    if (job?.output_text === null || job?.output_text === undefined) {
      return;
    }
    setInputText(job.output_text);
    onClose();
    navigate('/workspace');
  };

  return (
    <Dialog
      open={jobId !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent aria-describedby="history-detail-description">
        <DialogHeader>
          <DialogTitle>Writing details</DialogTitle>
          <DialogDescription id="history-detail-description">
            Full texts and quality metrics for this revision.
          </DialogDescription>
        </DialogHeader>

        {status === 'loading' && (
          <div role="status" aria-label="Loading entry" className="space-y-3">
            <span className="sr-only">Loading entry…</span>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {status === 'error' && (
          <div role="alert" className="text-sm text-subink-light dark:text-subink-dark">
            Could not load this entry. It may have been deleted.
          </div>
        )}

        {status === 'ready' && job !== null && (
          <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
            <section aria-label="Original input">
              <h3 className="text-sm font-semibold">Original</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{job.input_text}</p>
            </section>
            <section aria-label="Revised output">
              <h3 className="text-sm font-semibold">Revised</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                {job.output_text ?? 'No output was produced.'}
              </p>
            </section>
            {job.analysis !== null && <AnalysisPanel analysis={job.analysis} />}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            disabled={status !== 'ready' || job?.output_text == null}
            onClick={handleLoadIntoWorkspace}
          >
            Load into Workspace
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={status !== 'ready' || deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? 'Deleting…' : 'Delete from History'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
