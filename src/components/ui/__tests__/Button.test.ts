// ============================================
// Unit Tests for Button Component
// ============================================

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { Button, IconButton } from '../Button';

// ============================================
// Tests
// ============================================

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('should render with primary variant by default', () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-black');
    expect(button).toHaveClass('text-white');
  });

  it('should render with outline variant', () => {
    render(<Button variant="outline">Outline Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('border-2');
    expect(button).toHaveClass('border-gray-300');
  });

  it('should render with ghost variant', () => {
    render(<Button variant="ghost">Ghost Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('text-black');
  });

  it('should render with danger variant', () => {
    render(<Button variant="danger">Danger Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-error');
    expect(button).toHaveClass('text-white');
  });

  it('should render with secondary variant', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-secondary');
    expect(button).toHaveClass('text-white');
  });

  it('should render with default variant', () => {
    render(<Button variant="default">Default Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-gray-900');
    expect(button).toHaveClass('text-white');
  });

  it('should render with sm size', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('px-3');
    expect(button).toHaveClass('py-1.5');
  });

  it('should render with md size', () => {
    render(<Button size="md">Medium</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('px-4');
    expect(button).toHaveClass('py-2');
  });

  it('should render with lg size', () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('px-6');
    expect(button).toHaveClass('py-3');
  });

  it('should render with loading state', () => {
    render(<Button loading>Loading...</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Loading...');
  });

  it('should show spinner when loading', () => {
    render(<Button loading>Loading...</Button>);
    const button = screen.getByRole('button');

    const spinner = button.querySelector('svg');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should render with full width', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('w-full');
  });

  it('should render with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('custom-class');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick handler when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not call onClick handler when loading', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} loading>Loading</Button>);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render child elements', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('should pass through additional props', () => {
    render(<Button data-testid="test-button" type="submit">Submit</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('data-testid', 'test-button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should have focus ring styles', () => {
    render(<Button>Focusable</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('focus:ring-2');
    expect(button).toHaveClass('focus:ring-offset-2');
  });

  it('should have transition styles', () => {
    render(<Button>Transition</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('transition-all');
    expect(button).toHaveClass('duration-150');
  });
});

describe('IconButton Component', () => {
  it('should render button with icon', () => {
    render(
      <IconButton>
        <svg data-testid="test-icon">
          <path d="M10 10" />
        </svg>
      </IconButton>
    );

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should render with ghost variant by default', () => {
    render(
      <IconButton>
        <svg>Icon</svg>
      </IconButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent');
  });

  it('should render with sm size', () => {
    render(
      <IconButton size="sm">
        <svg>Icon</svg>
      </IconButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-1.5');
  });

  it('should render with md size', () => {
    render(
      <IconButton size="md">
        <svg>Icon</svg>
      </IconButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-2');
  });

  it('should render with lg size', () => {
    render(
      <IconButton size="lg">
        <svg>Icon</svg>
      </IconButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-3');
  });

  it('should render with custom className', () => {
    render(
      <IconButton className="custom-icon-button">
        <svg>Icon</svg>
      </IconButton>
    )

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-icon-button');
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(
      <IconButton onClick={handleClick}>
        <svg>Icon</svg>
      </IconButton>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should pass through additional props', () => {
    render(
      <IconButton data-testid="test-icon-button" aria-label="Test Icon">
        <svg>Icon</svg>
      </IconButton>
    )

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-testid', 'test-icon-button');
    expect(button).toHaveAttribute('aria-label', 'Test Icon');
  });

  it('should have hover styles', () => {
    render(
      <IconButton>
        <svg>Icon</svg>
      </IconButton>
    )

    const button = screen.getByRole('button');
    expect(button).toHaveClass('hover:bg-gray-100');
    expect(button).toHaveClass('hover:text-gray-900');
  });
});
