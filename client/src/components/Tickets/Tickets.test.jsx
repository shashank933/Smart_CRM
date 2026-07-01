import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Tickets from './Tickets';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../api', () => ({
  api: {
    getTickets: vi.fn(),
    getContacts: vi.fn(),
    createTicket: vi.fn(),
    deleteTicket: vi.fn(),
  },
}));

import { api } from '../../api';

describe('Tickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTickets.mockResolvedValue({ tickets: [], statusCounts: {} });
    api.getContacts.mockResolvedValue([]);
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Tickets />
      </MemoryRouter>
    );
  }

  it('renders the heading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Tickets')).toBeInTheDocument();
    });
  });

  it('renders new ticket button', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /new ticket/i })).toBeInTheDocument();
    });
  });

  it('displays tickets after loading', async () => {
    api.getTickets.mockResolvedValueOnce({
      tickets: [
        {
          id: '1', ticket_number: 'TKT-001', subject: 'Login not working',
          status: 'open', priority: 'high',
          contact_name: 'John Doe',
          created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      statusCounts: { open: 1 },
    });
    renderComponent();
    await waitFor(() => {
      const els = screen.getAllByText('TKT-001');
      expect(els.length).toBeGreaterThan(0);
    });
  });
});
