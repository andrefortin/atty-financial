import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import { Input, Textarea, Select, Button } from '../ui';
import { cn } from '../../utils/formatters';
import { useMatterStore } from '../../store';
import { useUIStore } from '../../store';
import { CreateMatterInput, MatterStatus } from '../../types';

export interface AddMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddMatterModal: React.FC<AddMatterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [matterId, setMatterId] = useState('');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMatter = useMatterStore((state) => state.createMatter);
  const showSuccess = useUIStore((state) => state.showSuccess);
  const showError = useUIStore((state) => state.showError);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setMatterId('');
      setClientName('');
      setNotes('');
      setErrors({});
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!matterId.trim()) {
      newErrors.matterId = 'Matter ID is required';
    } else if (!/^[A-Z]{3}-\d{4}-\d{3}$/.test(matterId)) {
      newErrors.matterId = 'Matter ID must be in format: XXX-YYYY-NNN (e.g., JON-2024-001)';
    }

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
      createMatter({
        id: matterId.trim(),
        clientName: clientName.trim(),
        notes: notes.trim() || undefined,
      });

      showSuccess('Success', 'Matter created successfully');
      onSuccess?.();

      // Reset and close
      setMatterId('');
      setClientName('');
      setNotes('');
      setErrors({});
      onClose();
    } catch (error) {
      showError('Error', 'Failed to create matter. Please try again.');
      console.error('Error creating matter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateMatterId = () => {
    const initials = clientName
      .split(' ')
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase())
      .join('');
    const year = new Date().getFullYear();
    const timestamp = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const generatedId = `${initials.padEnd(3, 'X')}-${year}-${timestamp}`;
    setMatterId(generatedId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="Create New Matter">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <Input
                id="matterId"
                label="Matter ID"
                value={matterId}
                onChange={(e) => setMatterId(e.target.value)}
                placeholder="e.g., JON-2024-001"
                error={errors.matterId}
                helperText="Format: XXX-YYYY-NNN (3 letters, year, 3 digits)"
                fullWidth
              />
              <div className="mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={generateMatterId}
                  disabled={!clientName.trim()}
                  fullWidth
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Auto-Generate ID
                </Button>
              </div>
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

            <Textarea
              id="notes"
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this matter (case type, description, etc.)"
              error={errors.notes}
              helperText={`${notes.length}/500 characters`}
              fullWidth
              rows={3}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">New Matter Status</p>
                  <p className="text-xs text-blue-700 mt-1">
                    New matters are automatically created as <strong>Active</strong>. You can begin allocating
                    transactions immediately. The matter will accrue interest from the creation date.
                  </p>
                </div>
              </div>
            </div>
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
            disabled={!matterId.trim() || !clientName.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Matter'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AddMatterModal;
