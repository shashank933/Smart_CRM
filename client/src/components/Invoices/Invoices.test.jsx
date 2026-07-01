import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Invoices from './Invoices';

vi.mock('../../api', () => ({
  api: {
    getInvoices: vi.fn(),
    getContacts: vi.fn(),
    getCompanies: vi.fn(),
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    deleteInvoice: vi.fn(),
  },
}));

import { api } from '../../api';

vi.mock('../../store/store', () => ({
  useStore: vi.fn((selector) => {
    const state = { fetchStats: vi.fn().mockResolvedValue(undefined) };
    return selector ? selector(state) : state;
  }),
}));

describe('Invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getInvoices.mockResolvedValue([]);
    api.getContacts.mockResolvedValue([]);
    api.getCompanies.mockResolvedValue([]);
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Invoices />
      </MemoryRouter>
    );
  }

  it('renders the heading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });
  });

  it('has create invoice button', async () => {
    renderComponent();
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /create invoice/i });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('displays invoices after loading', async () => {
    api.getInvoices.mockResolvedValueOnce([
      {
        id: '1', invoice_number: 'INV-001', contact_name: 'John Doe',
        company_name: 'Acme Corp', amount: 5000, status: 'paid',
        issue_date: '2024-01-01T00:00:00Z', due_date: '2024-02-01T00:00:00Z',
      },
    ]);
    renderComponent();
    await waitFor(() => {
      const els = screen.getAllByText('INV-001');
      expect(els.length).toBeGreaterThan(0);
    });
  });
});
