import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CalendarView from './CalendarView';

vi.mock('../../api', () => ({
  api: {
    request: vi.fn(),
    createActivity: vi.fn(),
  },
}));

import { api } from '../../api';

describe('CalendarView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.request.mockResolvedValue([]);
  });

  it('renders the calendar after loading', async () => {
    render(<CalendarView />);
    await waitFor(() => {
      expect(screen.getByText('Upcoming Meetings')).toBeInTheDocument();
    });
  });

  it('renders month name and year', async () => {
    render(<CalendarView />);
    await waitFor(() => {
      const today = new Date();
      const monthName = today.toLocaleString('default', { month: 'long' });
      expect(screen.getByText(`${monthName} ${today.getFullYear()}`)).toBeInTheDocument();
    });
  });

  it('renders day headers', async () => {
    render(<CalendarView />);
    await waitFor(() => {
      expect(screen.getByText('Sun')).toBeInTheDocument();
    });
  });

  it('shows empty states when no events', async () => {
    render(<CalendarView />);
    await waitFor(() => {
      expect(screen.getByText('No upcoming meetings')).toBeInTheDocument();
      expect(screen.getByText('No pending tasks')).toBeInTheDocument();
    });
  });

  it('renders events in the sidebar', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const mockEvents = [
      { id: '1', type: 'meeting', subject: 'Team Standup', due_date: dateStr, status: 'pending' },
      { id: '2', type: 'task', subject: 'Review PR', due_date: dateStr, status: 'pending' },
    ];
    api.request.mockResolvedValueOnce(mockEvents);
    render(<CalendarView />);
    await waitFor(() => {
      const teamEls = screen.getAllByText('Team Standup');
      expect(teamEls.length).toBeGreaterThan(0);
      const reviewEls = screen.getAllByText('Review PR');
      expect(reviewEls.length).toBeGreaterThan(0);
    });
  });
});
