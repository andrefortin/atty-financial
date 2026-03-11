import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { Input, Textarea, Select, Button } from '../ui';
import { cn } from '../../utils/formatters';
import { useMatterStore } from '../../store';
import { useUIStore } from '../../store';
import { UpdateMatterInput, MatterStatus } from '../../types';

export interface EditMatterModalProps {
  isOpen: boolean;
  matterId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditMatterModal: React.FC<EditMatterModalProps> = ({
  isOpen,
  matterId,
  onClose,
  onSuccess,
}) => {
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState<MatterStatus>('Active');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateMatter = useMatterStore((state) => state.updateMatter);
  const closeMatter = useMatterStore((state) => state.closeMatter);
  const reopenMatter = useMatterStore((state) => state.reopenMatter);
  const getMatterById = useMatterStore((state) => state.getMatterById);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  // Load matter data when modal opens
  useEffect(() => {
    if (isOpen && matterId) {
      const matter = getMatterById(matterId);
      if (matter) {
        setClientName(matter.clientName);
        setStatus(matter.status);
        setNotes(matter.notes || '');
        setErrors({});
      }
    }
  }, [isOpen, matterId, getMatterById]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    } else if (clientName.trim().length < 2) {
      newErrors.clientName = 'Client name must be at least 2 characters';
    } else if (clientName.trim().length > 100) {
      newErrors.clientName = 'Client name must not exceed 100 characters';
    }

    if (notes.length > 500) {
      newErrors.notes = 'Notes must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // If changing to Closed, use closeMatter
      if (status === 'Closed') {
        closeMatter(matterId);
        showSuccess('Success', 'Matter closed successfully');
      } else {
        // Otherwise, use updateMatter
        updateMatter(matterId, {
          clientName: clientName.trim(),
          status,
          notes: notes.trim() || undefined,
        });
        showSuccess('Success', 'Matter updated successfully');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      showError('Error', 'Failed to update matter. Please try again.');
      console.error('Error updating matter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Archive', label: 'Archive' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Edit Matter">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Matter ID:</strong> {matterId}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Matter ID cannot be changed after creation
              </p>
            </div>

            <Input
              id="clientName"
              label="Client Name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Enter client's full name"
              error={errors.clientName}
              helperText="The legal or business name of the client"
              fullWidth
              required
            />

            <Select
              id="status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MatterStatus)}
              options={statusOptions}
              helperText={
                status === 'Active'
                  ? 'Matter is open and accruing interest'
                  : status === 'Closed'
                  ? 'Matter is closed, no longer accruing interest'
                  : 'Matter is archived, visible for historical purposes'
              }
              fullWidth
            />

            {status === 'Active' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 0 8 8 0 0116 0zm-3.293-6.707a1 1 0 00-1.414-1.414L10 10.586 6 6.586 6.586a1 1 0 101.414 1.414L10 16.414l-6.293-6.293a1 1 0 00-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-900">Active Matter</p>
                    <p className="text-xs text-green-700 mt-1">
                      This matter is open and will accrue interest on outstanding balances.
                      Transactions can be allocated and payments made.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === 'Closed' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 100 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Closing Matter</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Closed matters stop accruing interest. Principal balances should be paid in full.
                      Outstanding balances will be tracked for overdue monitoring.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Textarea
              id="notes"
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this matter (case type, description, etc.)"
              error={errors.notes}
              helperText={`${notes.length}/500 characters`}
              fullWidth
              rows={4}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!clientName.trim()}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EditMatterModal;
