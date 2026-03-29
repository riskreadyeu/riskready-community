import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DataTable, type Column, type RowAction, StatusBadge, CriticalityBadge } from '../data-table';

type TestItem = { id: string; name: string; status: string };

const columns: Column<TestItem>[] = [
  { key: 'name', header: 'Name', render: (item) => item.name },
  { key: 'status', header: 'Status', render: (item) => item.status },
];

const sampleData: TestItem[] = [
  { id: '1', name: 'Risk A', status: 'Open' },
  { id: '2', name: 'Risk B', status: 'Closed' },
  { id: '3', name: 'Risk C', status: 'Open' },
];

function renderTable(props: Partial<React.ComponentProps<typeof DataTable<TestItem>>> = {}) {
  return render(
    <MemoryRouter>
      <DataTable
        data={sampleData}
        columns={columns}
        keyExtractor={(item) => item.id}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('DataTable', () => {
  it('renders column headers', () => {
    renderTable();

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders all data rows', () => {
    renderTable();

    expect(screen.getByText('Risk A')).toBeInTheDocument();
    expect(screen.getByText('Risk B')).toBeInTheDocument();
    expect(screen.getByText('Risk C')).toBeInTheDocument();
  });

  it('shows empty message when data is empty', () => {
    renderTable({ data: [] });

    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    renderTable({ data: [], emptyMessage: 'Nothing here' });

    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderTable({ loading: true });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // Data should not be rendered while loading
    expect(screen.queryByText('Risk A')).not.toBeInTheDocument();
  });

  it('renders title and description', () => {
    renderTable({ title: 'Risk Register', description: 'All risks' });

    expect(screen.getByText('Risk Register')).toBeInTheDocument();
    expect(screen.getByText('All risks')).toBeInTheDocument();
  });

  it('filters data when search is active', async () => {
    const user = userEvent.setup();

    renderTable({
      searchFilter: (item, query) =>
        item.name.toLowerCase().includes(query.toLowerCase()),
      searchPlaceholder: 'Search risks...',
    });

    const searchInput = screen.getByPlaceholderText('Search risks...');
    await user.type(searchInput, 'Risk A');

    expect(screen.getByText('Risk A')).toBeInTheDocument();
    expect(screen.queryByText('Risk B')).not.toBeInTheDocument();
    expect(screen.queryByText('Risk C')).not.toBeInTheDocument();
  });

  it('calls onRowClick when a row is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderTable({ onRowClick: onClick });

    await user.click(screen.getByText('Risk A'));

    expect(onClick).toHaveBeenCalledWith(sampleData[0]);
  });

  it('renders row action buttons for each row', () => {
    const actions: RowAction<TestItem>[] = [
      { label: 'View', onClick: vi.fn() },
      { label: 'Delete', onClick: vi.fn(), variant: 'destructive' },
    ];

    renderTable({ rowActions: actions });

    // The action column header should exist (empty header for actions)
    // There should be action trigger buttons (one per row) - they're hidden via opacity but in DOM
    const actionButtons = screen.getAllByRole('button');
    // At least 3 row action trigger buttons (one per data row)
    expect(actionButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders pagination controls', () => {
    const onPageChange = vi.fn();

    renderTable({
      pagination: {
        page: 1,
        pageSize: 10,
        total: 50,
        onPageChange,
      },
    });

    expect(screen.getByText(/Showing 1-10 of 50 items/)).toBeInTheDocument();
    expect(screen.getByTitle('Next page')).toBeInTheDocument();
    expect(screen.getByTitle('Previous page')).toBeInTheDocument();
  });

  it('disables previous page button on first page', () => {
    renderTable({
      pagination: {
        page: 1,
        pageSize: 10,
        total: 50,
        onPageChange: vi.fn(),
      },
    });

    expect(screen.getByTitle('Previous page')).toBeDisabled();
    expect(screen.getByTitle('First page')).toBeDisabled();
  });

  it('disables next page button on last page', () => {
    renderTable({
      pagination: {
        page: 5,
        pageSize: 10,
        total: 50,
        onPageChange: vi.fn(),
      },
    });

    expect(screen.getByTitle('Next page')).toBeDisabled();
    expect(screen.getByTitle('Last page')).toBeDisabled();
  });

  it('calls onPageChange when pagination button is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    renderTable({
      pagination: {
        page: 2,
        pageSize: 10,
        total: 50,
        onPageChange,
      },
    });

    await user.click(screen.getByTitle('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { container } = render(<StatusBadge status="Error" variant="destructive" />);
    const badge = container.querySelector('[class*="destructive"]');
    expect(badge).toBeInTheDocument();
  });
});

describe('CriticalityBadge', () => {
  it('renders the criticality level', () => {
    render(<CriticalityBadge level="high" />);
    expect(screen.getByText('high')).toBeInTheDocument();
  });
});
