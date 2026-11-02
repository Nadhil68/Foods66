import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Navbar from '../components/Navbar';
import * as Store from '../store/useStore';
import * as AuthCtx from '../context/AuthContext';

// Mock store
vi.mock('../store/useStore', () => ({
  useAuthStore: vi.fn(),
  useCartStore: vi.fn(),
  useAppStore: vi.fn()
}));

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Store.useAppStore as any).mockReturnValue({
      recommendations: [],
      refreshRecommendations: vi.fn()
    });
  });

  it('renders login/register links when no user is logged in', () => {
    (AuthCtx.useAuth as any).mockReturnValue({ user: null, logout: vi.fn() });
    (Store.useAuthStore as any).mockReturnValue({ user: null });
    (Store.useCartStore as any).mockReturnValue({ cart: [] });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('FOODS66')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('renders user name and navigation links when logged in', () => {
    (AuthCtx.useAuth as any).mockReturnValue({
      user: { id: '1', name: 'John Doe', email: 'john@example.com', role: 'customer' },
      logout: vi.fn()
    });
    (Store.useAuthStore as any).mockReturnValue({ user: { firstName: 'John', healthProfile: {} }, logout: vi.fn() });
    (Store.useCartStore as any).mockReturnValue({ cart: [] });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('displays correct cart item count', () => {
    (AuthCtx.useAuth as any).mockReturnValue({
      user: { id: '1', name: 'John Doe', email: 'john@example.com', role: 'customer' },
      logout: vi.fn()
    });
    (Store.useAuthStore as any).mockReturnValue({ user: { firstName: 'John', healthProfile: {} }, logout: vi.fn() });
    (Store.useCartStore as any).mockReturnValue({ 
      cart: [{ id: '1', quantity: 2, price: 100 }, { id: '2', quantity: 3, price: 50 }] 
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Cart total quantity should be 5 (matches both mobile and desktop indicators)
    const countBadges = screen.getAllByText('5');
    expect(countBadges.length).toBeGreaterThan(0);
    expect(countBadges[0]).toBeInTheDocument();
  });
});
