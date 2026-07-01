import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Apps from './Apps';

vi.mock('../../api', () => ({
  api: {
    request: vi.fn(),
  },
}));

import { api } from '../../api';

describe('Apps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.request.mockImplementation((endpoint) => {
      if (endpoint === '/apps') return Promise.resolve([]);
      return Promise.resolve({});
    });
  });

  it('renders the page heading', async () => {
    render(<Apps />);
    await waitFor(() => {
      expect(screen.getByText('API Tokens & Connected Apps')).toBeInTheDocument();
    });
  });

  it('shows empty state when no tokens', async () => {
    render(<Apps />);
    await waitFor(() => {
      expect(screen.getByText('No API Tokens')).toBeInTheDocument();
    });
  });

  it('displays token cards when data is loaded', async () => {
    const tokens = [
      {
        id: '1', name: 'My API Token', status: 'active',
        last_used: '2024-01-01T00:00:00Z', expires_at: null,
        created_at: '2024-01-01T00:00:00Z', token_preview: 'sk-abc...',
        permissions: {
          contacts: { read: true, write: true, delete: false },
          companies: { read: true, write: true, delete: false },
          deals: { read: true, write: true, delete: false },
          invoices: { read: false, write: false, delete: false },
          conversations: { read: false, write: false, delete: false },
          tickets: { read: false, write: false, delete: false },
        },
      },
    ];
    api.request.mockImplementation((endpoint) => {
      if (endpoint === '/apps') return Promise.resolve(tokens);
      return Promise.resolve({});
    });
    render(<Apps />);
    await waitFor(() => {
      expect(screen.getByText('My API Token')).toBeInTheDocument();
    });
  });

  it('opens create token modal', async () => {
    render(<Apps />);
    await waitFor(() => {
      expect(screen.queryByText('No API Tokens')).toBeInTheDocument();
    });
    const createBtn = screen.getByRole('button', { name: /generate token/i });
    await userEvent.click(createBtn);
    await waitFor(() => {
      expect(screen.getByText('Generate API Token')).toBeInTheDocument();
    });
  });

  it('shows token preview after creation', async () => {
    api.request.mockImplementation((endpoint, options) => {
      if (endpoint === '/apps' && options && options.method === 'POST') {
        return Promise.resolve({ id: 'new-1', name: 'Token Name', token: 'sk-generated-token-here', permissions: {} });
      }
      if (endpoint === '/apps') return Promise.resolve([]);
      return Promise.resolve({});
    });
    render(<Apps />);
    await waitFor(() => screen.getByText('No API Tokens'));

    const createBtn = screen.getByRole('button', { name: /generate token/i });
    await userEvent.click(createBtn);
    await waitFor(() => screen.getByText('Generate API Token'));

    const nameInput = screen.getByPlaceholderText('e.g., Sales Dashboard Integration');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Token Name');

    const modal = screen.getByText('Generate API Token').closest('.clay-modal');
    const submitBtn = within(modal).getByRole('button', { name: /generate token/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('sk-generated-token-here')).toBeInTheDocument();
    });
  });
});
