import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Companies from './Companies';

vi.mock('../../api', () => ({
  api: {
    getCompanies: vi.fn(),
    createCompany: vi.fn(),
    updateCompany: vi.fn(),
    deleteCompany: vi.fn(),
  },
}));

import { api } from '../../api';

vi.mock('../../store/store', () => ({
  useStore: vi.fn((selector) => {
    const state = { fetchStats: vi.fn().mockResolvedValue(undefined) };
    return selector ? selector(state) : state;
  }),
}));

describe('Companies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getCompanies.mockResolvedValue([]);
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Companies />
      </MemoryRouter>
    );
  }

  it('renders the heading', () => {
    renderComponent();
    expect(screen.getByText('Companies')).toBeInTheDocument();
  });

  it('renders add company button', () => {
    renderComponent();
    expect(screen.getByText('Add Company')).toBeInTheDocument();
  });

  it('displays companies after loading', async () => {
    api.getCompanies.mockResolvedValueOnce([
      {
        id: '1', name: 'Acme Corp', industry: 'Technology', size: '51-200',
        website: 'https://acme.com', phone: '555-0100', city: 'San Francisco',
        state: 'CA', country: 'US', address: '123 Main St', linkedin_url: '',
        revenue: '5000000', description: 'A great company',
      },
    ]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  it('displays industry badge', async () => {
    api.getCompanies.mockResolvedValueOnce([
      {
        id: '1', name: 'Acme Corp', industry: 'Technology', size: '51-200',
        website: 'https://acme.com', phone: '', city: '', state: '', country: '',
        address: '', linkedin_url: '', revenue: '', description: '',
      },
    ]);
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
  });
});
