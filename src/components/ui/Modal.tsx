import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/formatters';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  modalType?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  modalType = 'modal',
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  // Handle focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Save previous active element
      const previousActiveElement = document.activeElement as HTMLElement;

      // Focus on close button first (for accessibility)
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }

      // Focus on modal
      modalRef.current.focus();

      // Return focus when modal closes
      return () => {
        if (previousActiveElement) {
          previousActiveElement.focus();
        }
      };
    }
  }, [isOpen]);

  // Handle escape key press
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!closeOnEscape) return;

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current && closeOnOverlayClick) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={cn(
          'relative mx-auto my-8 bg-white dark:bg-gray-900 rounded-lg shadow-2xl',
          'transform transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal={isOpen ? 'true' : 'false'}
        aria-labelledby={title ? `${modalType}-title` : undefined}
        aria-describedby={title ? `${modalType}-description` : undefined}
      >
        {/* Header */}
        {title && (
          <ModalHeader>
            <ModalTitle id={`${modalType}-title`}>
              {title}
            </ModalTitle>
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </Button>
          </ModalHeader>
        )}

        {/* Content */}
        <ModalBody id={`${modalType}-description`}>
          {children}
        </ModalBody>

        {/* Footer */}
        {footer && (
          <ModalFooter>
            {footer}
          </ModalFooter>
        )}
      </div>
    </div>
  );
};

export const ModalHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('flex items-start justify-between mb-4 px-6', className)}>
      {children}
    </div>
  );
};

export const ModalTitle: React.FC<{ children: React.ReactNode; id?: string; className?: string }> = ({
  children,
  id,
  className,
}) => {
  return (
    <h3
      id={id}
      className={cn('text-xl font-semibold text-gray-900 dark:text-white', className)}
    >
      {children}
    </h3>
  );
};

export const ModalBody: React.FC<{ children: React.ReactNode; id?: string; className?: string }> = ({
  children,
  id,
  className,
}) => {
  return (
    <div
      id={id}
      className={cn('p-6 overflow-y-auto max-h-[70vh]', className)}
    >
      {children}
    </div>
  );
};

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700', className)}>
      {children}
    </div>
  );
};

export default Modal;
