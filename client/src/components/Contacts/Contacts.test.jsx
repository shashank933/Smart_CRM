import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Contacts from './Contacts';

vi.mock('../../api', () => ({
  api: {
    getContacts: vi.fn(),
    getCompanies: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
  },
}));

import { api } from '../../api';

vi.mock('../../store/store', () => ({
  useStore: vi.fn((selector) => {
    const state = { fetchStats: vi.fn().mockResolvedValue(undefined) };
    return selector ? selector(state) : state;
  }),
}));

describe('Contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getContacts.mockResolvedValue([]);
    api.getCompanies.mockResolvedValue([]);
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Contacts />
      </MemoryRouter>
    );
  }

  it('renders the heading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Contacts')).toBeInTheDocument();
    });
  });

  it('has add contact button', async () => {
    renderComponent();
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /add contact/i });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('displays contacts after loading', async () => {
    api.getContacts.mockResolvedValueOnce([
      {
        id: '1', first_name: 'John', last_name: 'Doe', email: 'john@example.com',
        phone: '555-0100', company_name: 'Acme', status: 'active', title: 'CEO',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]);
    renderComponent();
    await waitFor(() => {
      const nameEls = screen.getAllByText(/John\s+Doe/);
      expect(nameEls.length).toBeGreaterThan(0);
    });
  });
});
