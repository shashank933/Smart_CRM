import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Deals from './Deals';

vi.mock('../../api', () => ({
  api: {
    getDealStages: vi.fn(),
    getContacts: vi.fn(),
    getCompanies: vi.fn(),
    createDeal: vi.fn(),
    updateDeal: vi.fn(),
    deleteDeal: vi.fn(),
  },
}));

import { api } from '../../api';

vi.mock('../../store/store', () => ({
  useStore: vi.fn((selector) => {
    const state = { fetchStats: vi.fn().mockResolvedValue(undefined) };
    return selector ? selector(state) : state;
  }),
}));

describe('Deals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDealStages.mockResolvedValue([]);
    api.getContacts.mockResolvedValue([]);
    api.getCompanies.mockResolvedValue([]);
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Deals />
      </MemoryRouter>
    );
  }

  it('renders the heading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Deals Pipeline')).toBeInTheDocument();
    });
  });

  it('renders add deal button', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add deal/i })).toBeInTheDocument();
    });
  });

  it('renders pipeline stage columns', async () => {
    api.getDealStages.mockResolvedValueOnce([
      { stage: 'Lead', count: 1, value: 5000, deals: [{ id: '1', name: 'Deal 1', value: 5000, contact_name: 'John', company_name: 'Acme', expected_close_date: '2024-12-01', probability: 50, priority: 'medium' }] },
      { stage: 'Qualified', count: 0, value: 0, deals: [] },
    ]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Lead')).toBeInTheDocument();
      expect(screen.getByText('Qualified')).toBeInTheDocument();
    });
  });

  it('displays deal cards with values', async () => {
    api.getDealStages.mockResolvedValueOnce([
      { stage: 'Lead', count: 1, value: 10000, deals: [{ id: '1', name: 'Big Deal', value: 10000, contact_name: 'Jane', company_name: 'Inc', expected_close_date: '2024-12-01', probability: 75, priority: 'high' }] },
    ]);
    renderComponent();
    await waitFor(() => {
      const els = screen.getAllByText('$10,000');
      expect(els.length).toBeGreaterThan(0);
    });
  });
});
