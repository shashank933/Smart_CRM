import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSetUser = vi.fn();
const mockLogout = vi.fn();
vi.mock('../../store/store', () => ({
  useStore: vi.fn((selector) => {
    const state = {
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'Admin' },
      setUser: mockSetUser,
      logout: mockLogout,
    };
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

vi.mock('../../api', () => ({
  api: {
    request: vi.fn().mockResolvedValue({}),
    deleteAccount: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );
  }

  it('renders the page heading', () => {
    renderComponent();
    expect(screen.getByText('My Profile')).toBeInTheDocument();
  });

  it('renders user name and email', () => {
    renderComponent();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders user role badge', () => {
    renderComponent();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders user initials in avatar', () => {
    renderComponent();
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('renders edit profile form', () => {
    renderComponent();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('renders change password section', () => {
    renderComponent();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('renders danger zone section', () => {
    renderComponent();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    expect(screen.getByText('Delete My Account')).toBeInTheDocument();
  });

  it('renders save changes button', () => {
    renderComponent();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('renders back button', () => {
    renderComponent();
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('shows name input with user name pre-filled', () => {
    renderComponent();
    const nameInput = screen.getByPlaceholderText('Your name') as HTMLInputElement;
    expect(nameInput.value).toBe('Test User');
  });
});
