import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const mockLogin = vi.fn().mockResolvedValue(undefined);
vi.mock('../../store/store', () => ({
  useStore: vi.fn((selector) => {
    const state = { login: mockLogin };
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

vi.mock('../../assets/logo.svg', () => ({
  default: 'logo.svg',
}));

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderComponent() {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  }

  it('renders the login form heading', () => {
    renderComponent();
    expect(screen.getByText('Every customer signal in motion.')).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders login button', () => {
    renderComponent();
    expect(screen.getByText('Login to Dashboard')).toBeInTheDocument();
  });

  it('renders Google Sign In button', () => {
    renderComponent();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('pre-fills demo credentials', () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(emailInput.value).toBe('demo@smartcrm.com');
    expect(passwordInput.value).toBe('demo123');
  });

  it('toggles to register mode', async () => {
    renderComponent();
    await userEvent.click(screen.getByText('Sign up for free'));
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  it('toggles back to login mode', async () => {
    renderComponent();
    await userEvent.click(screen.getByText('Sign up for free'));
    await userEvent.click(screen.getByText('Sign In'));
    expect(screen.getByText('Login to Dashboard')).toBeInTheDocument();
  });

  it('handles Google login click', async () => {
    renderComponent();
    await userEvent.click(screen.getByText('Sign in with Google'));
    expect(screen.getByText('Google OAuth integration is not configured in this demo environment.')).toBeInTheDocument();
  });

  it('renders feature grid items', () => {
    renderComponent();
    expect(screen.getByText('Connected with WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Pipeline and deal velocity')).toBeInTheDocument();
    expect(screen.getByText('Automated workflows')).toBeInTheDocument();
    expect(screen.getByText('Real-time revenue insights')).toBeInTheDocument();
  });
});
