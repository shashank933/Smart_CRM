import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AIAssistant from './AIAssistant';

vi.mock('../../api', () => ({
  api: {
    getContacts: vi.fn(),
    getCompanies: vi.fn(),
    getDeals: vi.fn(),
    getInsights: vi.fn(),
    aiChat: vi.fn(),
    predictiveScoring: vi.fn(),
    generateEmail: vi.fn(),
    contactInsight: vi.fn(),
    dealInsight: vi.fn(),
  },
}));

import { api } from '../../api';

describe('AIAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getContacts.mockResolvedValue([]);
    api.getCompanies.mockResolvedValue([]);
    api.getDeals.mockResolvedValue([]);
    api.getInsights.mockResolvedValue([]);
  });

  it('renders the heading', async () => {
    render(<AIAssistant />);
    await waitFor(() => {
      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });
  });

  it('renders all tabs', async () => {
    render(<AIAssistant />);
    await waitFor(() => {
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Deal Scoring')).toBeInTheDocument();
      expect(screen.getByText('Email Generator')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });
  });

  it('renders chat tab by default with empty state', async () => {
    render(<AIAssistant />);
    await waitFor(() => {
      expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    });
  });

  it('renders chat input', async () => {
    render(<AIAssistant />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
  });

  it('renders context panel', async () => {
    render(<AIAssistant />);
    await waitFor(() => {
      expect(screen.getByText('Add Context')).toBeInTheDocument();
    });
  });

  it('switches to scoring tab', async () => {
    render(<AIAssistant />);
    screen.getByText('Deal Scoring').click();
    await waitFor(() => {
      expect(screen.getByText('Analyze Pipeline')).toBeInTheDocument();
    });
  });

  it('switches to email tab', async () => {
    render(<AIAssistant />);
    screen.getByText('Email Generator').click();
    await waitFor(() => {
      expect(screen.getByText('Generate Professional Email')).toBeInTheDocument();
    });
  });

  it('switches to insights tab', async () => {
    render(<AIAssistant />);
    screen.getByText('Insights').click();
    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /generate insights/i });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
