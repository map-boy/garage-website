import { writeBatch, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { JobCard, Invoice } from '../types';

// Firestore hard-caps a batch at 500 writes. Stay comfortably under it.
const BATCH_LIMIT = 450;

export interface ResetMonthResult {
  archiveId: string;
  monthLabel: string;
  jobCount: number;
  invoiceCount: number;
}

/**
 * Archives the current jobs + invoices into a single snapshot doc at
 * garages/{garageId}/archives/{archiveId}, then deletes the originals
 * from the live `jobs` and `invoices` subcollections.
 *
 * Uses a single archive DOCUMENT (not sub-subcollections) so existing
 * firestore.rules — which already grant read/write on any doc one level
 * under garages/{garageId} — cover this with zero rule changes.
 */
export async function resetMonth(
  garageId: string,
  jobs: JobCard[],
  invoices: Invoice[]
): Promise<ResetMonthResult> {
  const now = new Date();
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const archiveId = `archive_${now.getTime()}`;
  const archivePath = `garages/${garageId}/archives/${archiveId}`;

  try {
    // 1. Write the snapshot first. If this fails, nothing gets deleted.
    const archiveRef = doc(db, 'garages', garageId, 'archives', archiveId);
    const snapshotBatch = writeBatch(db);
    snapshotBatch.set(archiveRef, {
      archivedAt: now.toISOString(),
      monthLabel,
      jobCount: jobs.length,
      invoiceCount: invoices.length,
      jobs,
      invoices,
    });
    await snapshotBatch.commit();

    // 2. Delete the originals in chunked batches (only after the archive is safe).
    const refsToDelete = [
      ...jobs.map((j) => doc(db, 'garages', garageId, 'jobs', j.id)),
      ...invoices.map((i) => doc(db, 'garages', garageId, 'invoices', i.id)),
    ];

    for (let i = 0; i < refsToDelete.length; i += BATCH_LIMIT) {
      const chunk = refsToDelete.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    return { archiveId, monthLabel, jobCount: jobs.length, invoiceCount: invoices.length };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, archivePath);
    throw error;
  }
}