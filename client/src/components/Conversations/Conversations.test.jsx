import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Conversations from './Conversations';

vi.mock('../../api', () => ({
  api: {
    getConversations: vi.fn(),
    getConversation: vi.fn(),
    sendMessage: vi.fn(),
    createConversation: vi.fn(),
    aiChat: vi.fn(),
    summarizeConversation: vi.fn(),
    getContacts: vi.fn(),
  },
}));

import { api } from '../../api';

describe('Conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getConversations.mockResolvedValue([]);
    api.getContacts.mockResolvedValue([]);
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Conversations />
      </MemoryRouter>
    );
  }

  it('renders the heading', () => {
    renderComponent();
    expect(screen.getByText('Conversations')).toBeInTheDocument();
  });

  it('renders channel filter buttons', () => {
    renderComponent();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('renders search input', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
  });

  it('displays conversations after loading', async () => {
    api.getConversations.mockResolvedValueOnce([
      {
        id: '1', contact_name: 'John Doe', subject: 'Support Request',
        channel: 'email', last_message: 'I need help', status: 'open',
        updated_at: '2024-01-01T00:00:00Z', unread_count: 2,
      },
    ]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Support Request')).toBeInTheDocument();
    });
  });

  it('shows new conversation button', () => {
    renderComponent();
    expect(screen.getByText('New Conversation')).toBeInTheDocument();
  });
});
