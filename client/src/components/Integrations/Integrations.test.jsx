import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Integrations from './Integrations';

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
    request: vi.fn(),
    getIntegrations: vi.fn(),
    connectIntegration: vi.fn(),
    disconnectIntegration: vi.fn(),
    testIntegration: vi.fn(),
    syncIntegration: vi.fn(),
  },
}));

import { api } from '../../api';

describe('Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.request.mockResolvedValue([]);
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Integrations />
      </MemoryRouter>
    );
  }

  it('renders the heading', () => {
    renderComponent();
    expect(screen.getByText('Integration Hub')).toBeInTheDocument();
  });

  it('renders providers after loading', async () => {
    const providers = [
      {
        id: 'gmail', name: 'Gmail', icon: 'Mail',
        description: 'Connect your Gmail account', color: '#4285F4',
        bg: 'rgba(66,133,244,0.1)',
        fields: [{ key: 'name', label: 'Name', type: 'text', placeholder: 'Enter name' }],
        webhookSupported: true, connection: null,
      },
    ];
    api.request.mockResolvedValueOnce(providers);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Gmail')).toBeInTheDocument();
    });
  });

  it('shows connect button for disconnected providers', async () => {
    const providers = [
      {
        id: 'gmail', name: 'Gmail', icon: 'Mail',
        description: 'Connect your Gmail', color: '#4285F4',
        bg: 'rgba(66,133,244,0.1)',
        fields: [{ key: 'name', label: 'Name', type: 'text', placeholder: '...' }],
        webhookSupported: false, connection: null,
      },
    ];
    api.request.mockResolvedValueOnce(providers);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });
  });

  it('shows connected status for connected providers', async () => {
    const providers = [
      {
        id: 'gmail', name: 'Gmail', icon: 'Mail',
        description: 'Connect your Gmail', color: '#4285F4',
        bg: 'rgba(66,133,244,0.1)', fields: [], webhookSupported: false,
        connection: {
          id: 'conn-1', status: 'connected', name: 'My Gmail',
          last_sync: '2024-01-01T00:00:00Z', webhook_secret: null,
          webhook_url: null, created_at: '2024-01-01T00:00:00Z',
        },
      },
    ];
    api.request.mockResolvedValueOnce(providers);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
  });
});
