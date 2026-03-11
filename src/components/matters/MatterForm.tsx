import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Textarea, Select } from '../ui';
import { cn, isValidMatterId } from '../../utils/formatters';
import { MatterFormData, MatterFormErrors } from '../../types/matters';
import { MATTER_STATUS } from '../../utils/constants';

export interface MatterFormProps {
  initialData?: Partial<MatterFormData>;
  onSubmit: (data: MatterFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const MatterForm: React.FC<MatterFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<MatterFormData>({
    id: initialData?.id || '',
    clientName: initialData?.clientName || '',
    status: initialData?.status || 'Active',
    notes: initialData?.notes,
  });

  const [errors, setErrors] = useState<MatterFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        clientName: initialData.clientName || '',
        status: initialData.status || 'Active',
        notes: initialData.notes,
      });
      setErrors({});
      setTouched({});
    }
  }, [initialData]);

  const validateField = (name: keyof MatterFormData, value: any): string | undefined => {
    switch (name) {
      case 'id':
        if (!value || value.trim() === '') {
          return 'Matter ID is required';
        }
        if (!isValidMatterId(value)) {
          return 'Matter ID must be 1-50 characters and can only contain letters, numbers, hyphens, and underscores';
        }
        break;
      case 'clientName':
        if (!value || value.trim() === '') {
          return 'Client name is required';
        }
        if (value.trim().length < 2) {
          return 'Client name must be at least 2 characters';
        }
        if (value.trim().length > 200) {
          return 'Client name must not exceed 200 characters';
        }
        break;
      case 'notes':
        if (value && value.length > 1000) {
          return 'Notes must not exceed 1000 characters';
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: MatterFormErrors = {};
    let isValid = true;

    // Validate all fields
    Object.keys(formData).forEach((key) => {
      const error = validateField(key as keyof MatterFormData, formData[key as keyof MatterFormData]);
      if (error) {
        newErrors[key as keyof MatterFormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (name: keyof MatterFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate field if already touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleFieldBlur = (name: keyof MatterFormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Archive', label: 'Archive' },
  ] as const;

  const isEditing = !!initialData?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Matter' : 'Create New Matter'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Matter ID */}
          <Input
            label="Matter ID"
            value={formData.id}
            onChange={(e) => handleFieldChange('id', e.target.value)}
            onBlur={() => handleFieldBlur('id')}
            error={touched.id && errors.id ? errors.id : undefined}
            helperText="Unique identifier for this matter (e.g., JON-2024-001)"
            placeholder="Enter matter ID"
            disabled={isEditing} // Can't change ID after creation
            fullWidth
          />

          {/* Client Name */}
          <Input
            label="Client Name"
            value={formData.clientName}
            onChange={(e) => handleFieldChange('clientName', e.target.value)}
            onBlur={() => handleFieldBlur('clientName')}
            error={touched.clientName && errors.clientName ? errors.clientName : undefined}
            placeholder="Enter client name"
            fullWidth
          />

          {/* Status */}
          <Select
            label="Status"
            options={statusOptions.map((s) => ({ value: s.value, label: s.label }))}
            value={formData.status}
            onChange={(e) => handleFieldChange('status', e.target.value)}
            fullWidth
          />

          {/* Notes */}
          <Textarea
            label="Notes"
            value={formData.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            onBlur={() => handleFieldBlur('notes')}
            error={touched.notes && errors.notes ? errors.notes : undefined}
            helperText="Optional notes about this matter (e.g., case type, description)"
            placeholder="Add notes about this matter..."
            rows={4}
            fullWidth
          />

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Matter' : 'Create Matter'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MatterForm;
