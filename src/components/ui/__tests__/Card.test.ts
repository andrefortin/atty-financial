// ============================================
// Unit Tests for Card Component
// ============================================

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../Card';

// ============================================
// Tests
// ============================================

describe('Card Component', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(
        <Card>
          <p>Card content</p>
        </Card>
      );

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should render with default classes', () => {
      render(
        <Card>
          <p>Content</p>
        </Card>
      )

      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('shadow-sm');
      expect(card).toHaveClass('border');
      expect(card).toHaveClass('border-gray-200');
      expect(card).toHaveClass('rounded-lg');
    });

    it('should render with custom className', () => {
      render(
        <Card className="custom-card">
          <p>Content</p>
        </Card>
      )

      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('custom-card');
    })

    it('should render with custom props', () => {
      render(
        <Card data-testid="test-card">
          <p>Content</p>
        </Card>
      )

      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument()
    })
  })

  describe('CardHeader', () => {
    it('should render header with content', () => {
      render(
        <CardHeader>Header content</CardHeader>
      )

      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('should render with proper padding', () => {
      render(
        <CardHeader>
          <p>Header</p>
        </CardHeader>
      )

      const header = screen.getByText('Header').closest('div')
      expect(header).toHaveClass('px-6')
      expect(header).toHaveClass('py-4')
    })

    it('should render with custom className', () => {
      render(
        <CardHeader className="custom-header">
          <p>Header</p>
        </CardHeader>
      )

      const header = screen.getByText('Header').closest('div')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle', () => {
    it('should render title text', () => {
      render(
        <CardTitle>Card Title</CardTitle>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })

    it('should render with proper typography', () => {
      render(
        <CardTitle>Card Title</CardTitle>
      )

      const title = screen.getByText('Card Title')
      expect(title).toHaveClass('text-xl')
      expect(title).toHaveClass('font-bold')
      expect(title).toHaveClass('text-black')
      expect(title).toHaveClass('mb-2')
    })

    it('should render with custom className', () => {
      render(
        <CardTitle className="custom-title">Card Title</CardTitle>
      )

      const title = screen.getByText('Card Title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardContent', () => {
    it('should render content with children', () => {
      render(
        <CardContent>
          <p>Card content</p>
        </CardContent>
      )

      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('should render with proper padding', () => {
      render(
        <CardContent>
          <p>Content</p>
        </CardContent>
      )

      const content = screen.getByText('Content').closest('div')
      expect(content).toHaveClass('px-6')
      expect(content).toHaveClass('pb-6')
    })

    it('should render with custom className', () => {
      render(
        <CardContent className="custom-content">
          <p>Content</p>
        </CardContent>
      )

      const content = screen.getByText('Content').closest('div')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('CardFooter', () => {
    it('should render footer with content', () => {
      render(
        <CardFooter>Footer content</CardFooter>
      )

      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should render with proper padding', () => {
      render(
        <CardFooter>
          <p>Footer</p>
        </CardFooter>
      )

      const footer = screen.getByText('Footer').closest('div')
      expect(footer).toHaveClass('px-6')
      expect(footer).toHaveClass('pb-4')
      expect(footer).toHaveClass('pt-4')
      expect(footer).toHaveClass('mt-4')
      expect(footer).toHaveClass('border-t')
    })

    it('should render with custom className', () => {
      render(
        <CardFooter className="custom-footer">
          <p>Footer</p>
        </CardFooter>
      )

      const footer = screen.getByText('Footer').closest('div')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Card Integration', () => {
    it('should render complete card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <p>Card footer</p>
          </CardFooter>
        </Card>
      )

      expect(screen.getByText('Complete Card')).toBeInTheDocument()
      expect(screen.getByText('Card content goes here')).toBeInTheDocument()
      expect(screen.getByText('Card footer')).toBeInTheDocument()
    })

    it('should render card with header and content only', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Content</p>
          </CardContent>
        </Card>
      )

      expect(screen.getByText('Simple Card')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(screen.queryByText('Footer')).not.toBeInTheDocument()
    })

    it('should pass through events from child elements', () => {
      const handleClick = jest.fn()
      
      render(
        <Card>
          <CardContent>
            <button onClick={handleClick}>Click me</button>
          </CardContent>
        </Card>
      )

      const button = screen.getByText('Click me')
      button.click()
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Card Variants', () => {
    it('should render card with different background colors', () => {
      render(
        <Card className="bg-gray-100">
          <p>Content</p>
        </Card>
      )

      const card = screen.getByText('Content').closest('div')
      expect(card).toHaveClass('bg-gray-100')
    })

    it('should render card with different border styles', () => {
      render(
        <Card className="border-2 border-blue-500">
          <p>Content</p>
        </Card>
      )

      const card = screen.getByText('Content').closest('div')
      expect(card).toHaveClass('border-2')
      expect(card).toHaveClass('border-blue-500')
    })

    it('should render card without shadow', () => {
      render(
        <Card className="shadow-none">
          <p>Content</p>
        </Card>
      )

      const card = screen.getByText('Content').closest('div')
      expect(card).not.toHaveClass('shadow-sm')
    })
  })

  describe('Card Accessibility', () => {
    it('should render with accessible title', () => {
      render(
        <Card role="article" aria-label="Article card">
          <CardContent>
            <p>Content</p>
          </CardContent>
        </Card>
      )

      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-label', 'Article card')
    })

    it('should render with accessible heading', () => {
      render(
        <CardHeader>
          <h2 id="card-heading">Card Heading</h2>
        </CardHeader>
        <CardContent aria-labelledby="card-heading">
          <p>Content</p>
        </CardContent>
      )

      const content = screen.getByText('Content').closest('[aria-labelledby]')
      expect(content).toHaveAttribute('aria-labelledby', 'card-heading')
    })
  })
})
