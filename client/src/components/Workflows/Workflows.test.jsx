import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Workflows from './Workflows';

vi.mock('../../api', () => ({
  api: {
    request: vi.fn(),
  },
}));

import { api } from '../../api';

describe('Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.request.mockImplementation((endpoint) => {
      if (endpoint === '/workflows') return Promise.resolve([]);
      if (endpoint === '/workflows/metadata') return Promise.resolve({ triggers: [], actions: [] });
      return Promise.resolve({});
    });
  });

  it('renders the heading', async () => {
    render(<Workflows />);
    await waitFor(() => {
      expect(screen.getByText('Workflows')).toBeInTheDocument();
    });
  });

  it('renders a create/new workflow button', async () => {
    render(<Workflows />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /workflow/i });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('displays workflows after loading', async () => {
    const workflows = [
      {
        id: '1', name: 'Auto-follow up', description: 'Send follow-up emails',
        trigger_type: 'contact_created', trigger_config: {}, actions: [],
        status: 'active', last_run_at: '2024-01-01T00:00:00Z', run_count: 5,
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
      },
    ];
    api.request.mockImplementation((endpoint) => {
      if (endpoint === '/workflows') return Promise.resolve(workflows);
      if (endpoint === '/workflows/metadata') return Promise.resolve({ triggers: [], actions: [] });
      return Promise.resolve({});
    });
    render(<Workflows />);
    await waitFor(() => {
      expect(screen.getByText('Auto-follow up')).toBeInTheDocument();
    });
  });

  it('opens create workflow modal', async () => {
    render(<Workflows />);
    await waitFor(() => screen.getAllByRole('button', { name: /workflow/i }));
    await userEvent.click(screen.getAllByRole('button', { name: /workflow/i })[0]);
    await waitFor(() => {
      const els = screen.getAllByText('New Workflow');
      expect(els.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows active status badge', async () => {
    const workflows = [
      {
        id: '1', name: 'Test Workflow', description: 'Test',
        trigger_type: 'contact_created', trigger_config: {}, actions: [],
        status: 'active', last_run_at: null, run_count: 0,
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
      },
    ];
    api.request.mockImplementation((endpoint) => {
      if (endpoint === '/workflows') return Promise.resolve(workflows);
      if (endpoint === '/workflows/metadata') return Promise.resolve({ triggers: [], actions: [] });
      return Promise.resolve({});
    });
    render(<Workflows />);
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });
});
