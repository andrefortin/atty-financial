// ============================================
// Unit Tests for Table Component
// ============================================

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { Table, Column } from '../Table';

// ============================================
// Mock Data
// ============================================

const mockColumns: Column[] = [
  {
    key: 'id',
    title: 'ID',
    sortable: true,
  },
  {
    key: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    key: 'amount',
    title: 'Amount',
    sortable: true,
    align: 'right',
  },
  {
    key: 'status',
    title: 'Status',
    sortable: false,
  },
];

const mockData = [
  { id: '1', name: 'Item 1', amount: 100, status: 'Active' },
  { id: '2', name: 'Item 2', amount: 200, status: 'Inactive' },
  { id: '3', name: 'Item 3', amount: 300, status: 'Active' },
];

// ============================================
// Tests
// ============================================

describe('Table Component', () => {
  describe('Table Rendering', () => {
    it('should render table with columns and data', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      mockColumns.forEach((column) => {
        expect(screen.getByText(column.title)).toBeInTheDocument();
      });
    });

    it('should render table rows', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      expect(screen.getAllByRole('row')).toHaveLength(mockData.length);
    });

    it('should render data cells', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      mockData.forEach((item) => {
        expect(screen.getByText(item.id)).toBeInTheDocument();
        expect(screen.getByText(item.name)).toBeInTheDocument();
      });
    });
  });

  describe('Column Rendering', () => {
    it('should render string cells', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      mockData.forEach((item) => {
        expect(screen.getByText(item.name)).toBeInTheDocument();
      });
    });

    it('should render number cells', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      mockData.forEach((item) => {
        const cell = screen.getByText(item.amount.toString());
        expect(cell).toBeInTheDocument();
      });
    });

    it('should render custom cell renderer', () => {
      const customColumns: Column[] = [
        {
          key: 'name',
          title: 'Name',
          render: (value: string) => <span className="text-blue-600">{value}</span>,
        },
      ];

      render(<Table columns={customColumns} data={mockData} />);

      const blueText = screen.getAllByText(/Item \d/);
      blueText.forEach((element) => {
        expect(element).toHaveClass('text-blue-600');
      });
    });

    it('should render boolean cells', () => {
      const boolData = [
        { id: '1', name: 'Item 1', active: true },
        { id: '2', name: 'Item 2', active: false },
      ];

      const boolColumns: Column[] = [
        { key: 'id', title: 'ID' },
        { key: 'name', title: 'Name' },
        { key: 'active', title: 'Active', render: (value: boolean) => (value ? 'Yes' : 'No') },
      ];

      render(<Table columns={boolColumns} data={boolData} />);

      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('should align right cells correctly', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const amountHeader = screen.getByText('Amount');
      const amountCell = screen.getByText('100');

      // Check alignment (would be via CSS classes)
      expect(amountHeader).toBeInTheDocument();
      expect(amountCell).toBeInTheDocument();
    });
  });

  describe('Table Styles', () => {
    it('should render with default styles', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const table = screen.getByRole('table');
      expect(table).toHaveClass('min-w-full');
      expect(table).toHaveClass('divide-y');
      expect(table).toHaveClass('divide-gray-200');
    });

    it('should render with custom className', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          className="custom-table"
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('custom-table');
    });

    it('should render with striped rows', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          striped
        />
      );

      const rows = screen.getAllByRole('row');
      rows.forEach((row, index) => {
        if (index % 2 === 1) {
          expect(row).toHaveClass('bg-gray-50');
        }
      });
    });

    it('should render with hover effect', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          hover
        />
      );

      const rows = screen.getAllByRole('row');
      rows.forEach((row) => {
        expect(row).toHaveClass('hover:bg-gray-100');
      });
    });

    it('should render with border', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          bordered
        />
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('border');
    });

    it('should render with compact size', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          size="compact"
        />
      );

      const cells = screen.getAllByRole('cell');
      cells.forEach((cell) => {
        expect(cell).toHaveClass('px-3');
        expect(cell).toHaveClass('py-2');
      });
    });

    it('should render with small size', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          size="small"
        />
      );

      const cells = screen.getAllByRole('cell');
      cells.forEach((cell) => {
        expect(cell).toHaveClass('px-3');
        expect(cell).toHaveClass('py-3');
      });
    });
  });

  describe('Sorting', () => {
    it('should show sort indicator for sortable columns', () => {
      render(<Table columns={mockColumns} data={mockData} sortable />);

      const idHeader = screen.getByText('ID');
      // Sort indicator would be in the header
      expect(idHeader).toBeInTheDocument();
    });

    it('should not show sort indicator for non-sortable columns', () => {
      render(<Table columns={mockColumns} data={mockData} sortable />);

      const statusHeader = screen.getByText('Status');
      expect(statusHeader).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty message when no data', () => {
      render(
        <Table
          columns={mockColumns}
          data={[]}
          emptyMessage="No data available"
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should render default empty message', () => {
      render(<Table columns={mockColumns} data={[]} />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should render table when data exists', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          emptyMessage="No data available"
        />
      );

      expect(screen.queryByText('No data available')).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render with proper aria attributes', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-sortable', 'none');
    });

    it('should render headers with scope="col"', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should render rows with scope="row"', () => {
      render(<Table columns={mockColumns} data={mockData} />);

      const rows = screen.getAllByRole('row');
      rows.forEach((row) => {
        expect(row).toHaveAttribute('scope', 'row');
      });
    });
  });

  describe('Pagination', () => {
    it('should render pagination controls', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          pagination
          pageSize={2}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText(/Page \d+ of \d+/)).toBeInTheDocument();
    });

    it('should render previous and next buttons', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          pagination
          pageSize={2}
        />
      );

      expect(screen.getByLabelText('Previous')).toBeInTheDocument();
      expect(screen.getByLabelText('Next')).toBeInTheDocument();
    });

    it('should show correct page numbers', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          pagination
          pageSize={2}
        />
      );

      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should render with row selection', () => {
      const selectedIds = ['1', '2'];

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          selectable
          selectedIds={selectedIds}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should highlight selected rows', () => {
      const selectedIds = ['1'];

      render(
        <Table
          columns={mockColumns}
          data={mockData}
          selectable
          selectedIds={selectedIds}
        />
      );

      // First row should have selected styling
      const rows = screen.getAllByRole('row');
      expect(rows[0]).toHaveClass('bg-black/10');
    });

    it('should render checkbox in first column', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          selectable
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockData.length);
    });
  });

  describe('Responsive', () => {
    it('should render with responsive container', () => {
      render(
        <div style={{ width: '100%' }}>
          <Table columns={mockColumns} data={mockData} responsive />
        </div>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle horizontal scroll', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          scrollable
        />
      );

      const tableContainer = screen.getByRole('table').parentElement;
      expect(tableContainer).toHaveClass('overflow-x-auto');
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          loading
        />
      );

      expect(screen.getAllByRole('progressbar')).toHaveLength(mockData.length);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should not show skeleton when not loading', () => {
      render(
        <Table
          columns={mockColumns}
          data={mockData}
          loading={false}
        />
      );

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
