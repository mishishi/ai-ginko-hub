import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

// Store for useAuth mock state that can be changed per test
let mockIsSignedIn = false;

vi.mock('@clerk/react', () => ({
  useAuth: () => ({ isSignedIn: mockIsSignedIn }),
  SignInButton: ({ children }: any) => <button>{children}</button>,
  UserButton: () => <div data-testid="user-button">UserButton</div>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Mock useTheme
vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

// Mock API_BASE
vi.mock('../lib/api', () => ({
  API_BASE: 'http://localhost:4001',
}));

const renderHeader = (props?: { searchQuery?: string; onSearchChange?: (q: string) => void }) => {
  return render(
    <BrowserRouter>
      <Header {...props} />
    </BrowserRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSignedIn = false;
  });

  it('renders logo link to /', () => {
    renderHeader();
    const logoLink = screen.getByRole('link', { name: /ginko hub 首页/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders nav links for projects and about', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: '项目' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '关于' })).toHaveAttribute('href', '/about');
  });

  it('renders search input when onSearchChange is provided', () => {
    renderHeader({ onSearchChange: vi.fn() });
    const searchInput = screen.getByLabelText('搜索项目');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearchChange when user types in search input', async () => {
    const onSearchChange = vi.fn();
    renderHeader({ onSearchChange });
    const searchInput = screen.getByLabelText('搜索项目');
    await userEvent.type(searchInput, 'react');
    expect(onSearchChange).toHaveBeenCalledWith('r');
    expect(onSearchChange).toHaveBeenCalledWith('re');
    expect(onSearchChange).toHaveBeenCalledWith('rea');
    expect(onSearchChange).toHaveBeenCalledWith('reac');
    expect(onSearchChange).toHaveBeenCalledWith('react');
  });

  it('shows SignInButton when not signed in', () => {
    renderHeader();
    // The outer button is the SignInButton wrapper, inner is the actual button
    const buttons = screen.getAllByRole('button', { name: '登录' });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows UserButton when signed in', () => {
    mockIsSignedIn = true;
    renderHeader();
    expect(screen.getByTestId('user-button')).toBeInTheDocument();
  });

  it('renders收藏 link when signed in', () => {
    mockIsSignedIn = true;
    renderHeader();
    expect(screen.getByRole('link', { name: '收藏' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '个人中心' })).toBeInTheDocument();
  });

  it('renders收藏 as disabled button when not signed in', () => {
    renderHeader();
    const buttons = screen.getAllByRole('button', { name: '收藏' });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    // The收藏 button should be a help cursor (cursor-help)
    const favBtn = buttons.find(b => b.classList.contains('cursor-help'));
    expect(favBtn).toBeInTheDocument();
  });
});
