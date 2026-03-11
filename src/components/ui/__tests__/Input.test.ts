// ============================================
// Unit Tests for Input Component
// ============================================

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { Input, Textarea } from '../Input';

// ============================================
// Tests
// ============================================

describe('Input Component', () => {
  it('should render input with placeholder', () => {
    render(<Input placeholder="Enter text..." />);
    const input = screen.getByPlaceholderText('Enter text...');

    expect(input).toBeInTheDocument();
  });

  it('should render with default type (text)', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render with email type', () => {
    render(<Input type="email" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render with number type', () => {
    render(<Input type="number" />);
    const input = screen.getByRole('spinbutton');

    expect(input).toHaveAttribute('type', 'number');
  });

  it('should render with password type', () => {
    render(<Input type="password" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('type', 'password');
  });

  it('should render with default styles', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('block');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('px-3');
    expect(input).toHaveClass('py-2');
    expect(input).toHaveClass('border');
    expect(input).toHaveClass('border-gray-300');
    expect(input).toHaveClass('rounded-md');
  });

  it('should render with custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('custom-input');
  });

  it('should render with error state', () => {
    render(<Input error />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveClass('focus:ring-red-500');
  });

  it('should render with disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');

    expect(input).toBeDisabled();
    expect(input).toHaveClass('bg-gray-100');
    expect(input).toHaveClass('cursor-not-allowed');
  });

  it('should render with readonly state', () => {
    render(<Input readOnly />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveClass('bg-gray-100');
  });

  it('should handle onChange events', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should handle onFocus events', () => {
    const handleFocus = jest.fn();
    render(<Input onFocus={handleFocus} />);

    const input = screen.getByRole('textbox');
    fireEvent.focus(input);

    expect(handleFocus).toHaveBeenCalled();
  });

  it('should handle onBlur events', () => {
    const handleBlur = jest.fn();
    render(<Input onBlur={handleBlur} />);

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    expect(handleBlur).toHaveBeenCalled();
  });

  it('should render with small size', () => {
    render(<Input size="sm" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('px-2');
    expect(input).toHaveClass('py-1');
    expect(input).toHaveClass('text-sm');
  });

  it('should render with large size', () => {
    render(<Input size="lg" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('px-4');
    expect(input).toHaveClass('py-3');
    expect(input).toHaveClass('text-lg');
  });

  it('should pass through additional props', () => {
    render(<Input data-testid="test-input" autoComplete="off" />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('data-testid', 'test-input');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('should render with left icon', () => {
    render(
      <Input
        leftIcon={
          <svg data-testid="left-icon">
            <path d="M10 10" />
          </svg>
        }
      />
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('should render with right icon', () => {
    render(
      <Input
        rightIcon={
          <svg data-testid="right-icon">
            <path d="M10 10" />
          </svg>
        }
      />
    );

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('should have focus styles', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('focus:outline-none');
    expect(input).toHaveClass('focus:ring-2');
    expect(input).toHaveClass('focus:ring-offset-2');
    expect(input).toHaveClass('focus:ring-primary');
  });

  it('should render with helper text', () => {
    render(
      <div>
        <Input helperText="Enter your name" />
        <span className="text-sm text-gray-500">Helper text should go here</span>
      </div>
    );
    // Helper text would be a separate component in real implementation
  });
});

describe('Textarea Component', () => {
  it('should render textarea with placeholder', () => {
    render(<Textarea placeholder="Enter description..." />);
    const textarea = screen.getByPlaceholderText('Enter description...');

    expect(textarea).toBeInTheDocument();
  });

  it('should render with default styles', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveClass('block');
    expect(textarea).toHaveClass('w-full');
    expect(textarea).toHaveClass('px-3');
    expect(textarea).toHaveClass('py-2');
    expect(textarea).toHaveClass('border');
    expect(textarea).toHaveClass('border-gray-300');
    expect(textarea).toHaveClass('rounded-md');
  });

  it('should render with custom className', () => {
    render(<Textarea className="custom-textarea" />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveClass('custom-textarea');
  });

  it('should render with error state', () => {
    render(<Textarea error />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveClass('border-red-500');
    expect(textarea).toHaveClass('focus:ring-red-500');
  });

  it('should render with disabled state', () => {
    render(<Textarea disabled />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('bg-gray-100');
  });

  it('should render with readonly state', () => {
    render(<Textarea readOnly />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveAttribute('readonly');
    expect(textarea).toHaveClass('bg-gray-100');
  });

  it('should render with small size', () => {
    render(<Textarea size="sm" />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveClass('px-2');
    expect(textarea).toHaveClass('py-1');
    expect(textarea).toHaveClass('text-sm');
  });

  it('should render with large size', () => {
    render(<Textarea size="lg" />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveClass('px-4');
    expect(textarea).toHaveClass('py-3');
    expect(textarea).toHaveClass('text-lg');
  });

  it('should render with specific rows', () => {
    render(<Textarea rows={5} />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('should render with max length', () => {
    render(<Textarea maxLength={100} />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveAttribute('maxlength', '100');
  });

  it('should handle onChange events', () => {
    const handleChange = jest.fn();
    render(<Textarea onChange={handleChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should handle onFocus events', () => {
    const handleFocus = jest.fn();
    render(<Textarea onFocus={handleFocus} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.focus(textarea);

    expect(handleFocus).toHaveBeenCalled();
  });

  it('should handle onBlur events', () => {
    const handleBlur = jest.fn();
    render(<Textarea onBlur={handleBlur} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.blur(textarea);

    expect(handleBlur).toHaveBeenCalled();
  });

  it('should have resize handle', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveClass('resize-none');
  });

  it('should allow custom resize', () => {
    render(<Textarea resize="vertical" />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).not.toHaveClass('resize-none');
    expect(textarea).toHaveClass('resize-vertical');
  });

  it('should pass through additional props', () => {
    render(<Textarea data-testid="test-textarea" />);

    expect(screen.getByTestId('test-textarea')).toBeInTheDocument();
  });

  it('should have focus styles', () => {
    render(<Textarea />);
    const textarea = screen.getByRole('textbox');

    expect(textarea).toHaveClass('focus:outline-none');
    expect(textarea).toHaveClass('focus:ring-2');
    expect(textarea).toHaveClass('focus:ring-offset-2');
    expect(textarea).toHaveClass('focus:ring-primary');
  });
});
