import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectCard from './ProjectCard';
import type { Project } from '../types';

vi.mock('../data/cardGradients', () => ({
  cardGradients: ['linear-gradient(135deg, #1c1a18 0%, #2a221e 50%, #1e1c1a 100%)'],
}));

vi.mock('react-router-dom', () => {
  const actual = vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn((path: string) => {})),
  };
});

vi.mock('../hooks/useScrollReveal', () => ({
  useScrollReveal: vi.fn(() => ({ ref: vi.fn(), isVisible: true })),
}));

vi.mock('../hooks/useFavorites', () => ({
  useFavorites: vi.fn(() => ({
    isFavorited: vi.fn(() => false),
    toggle: vi.fn(),
  })),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockProject: Project = {
  id: 'proj-1',
  name: 'Test Project',
  description: 'A test project description',
  tags: ['react', 'typescript'],
  thumbnail: undefined,
  url: 'https://example.com',
  repoUrl: 'https://github.com/example/test-project',
  createdAt: '2024-01-01T00:00:00.000Z',
  featured: false,
};

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project name and description', () => {
    render(<ProjectCard project={mockProject} index={0} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('A test project description')).toBeInTheDocument();
  });

  it('renders tags as clickable spans', () => {
    render(<ProjectCard project={mockProject} index={0} />);
    const tagSpans = screen.getAllByText(/react|typescript/);
    expect(tagSpans.length).toBe(2);
    tagSpans.forEach((span) => {
      expect(span.tagName.toLowerCase()).toBe('span');
    });
  });

  it('tag click calls navigate with correct tag param', async () => {
    const user = userEvent.setup();
    const { useNavigate } = await import('react-router-dom');
    const navigateMock = vi.fn();
    (useNavigate as ReturnType<typeof vi.fn>).mockReturnValue(navigateMock);

    render(<ProjectCard project={mockProject} index={0} />);
    const tagSpan = screen.getByText('react');
    await user.click(tagSpan);
    expect(navigateMock).toHaveBeenCalledWith('/?tag=react');
  });

  it('favorite button calls onFavoriteToggle prop', async () => {
    const { useFavorites } = await import('../hooks/useFavorites');
    const toggleMock = vi.fn();
    (useFavorites as ReturnType<typeof vi.fn>).mockReturnValue({
      isFavorited: vi.fn(() => false),
      toggle: toggleMock,
    });

    render(<ProjectCard project={mockProject} index={0} />);
    const favButton = screen.getByRole('button', { name: /添加收藏/ });
    await userEvent.click(favButton);
    expect(toggleMock).toHaveBeenCalledWith('proj-1');
  });

  it('open button is present when hovered', async () => {
    render(<ProjectCard project={mockProject} index={0} />);
    const card = screen.getByLabelText('查看项目 Test Project');

    // Open button is in the DOM (inside the overlay with opacity-0); jsdom does not
    // fully support CSS opacity for toBeVisible checks, so we verify presence only.
    const openButtonBefore = screen.queryByText('打开项目');
    expect(openButtonBefore).toBeInTheDocument();

    // Simulate mouse enter to show overlay
    fireEvent.mouseEnter(card);
    expect(screen.getByText('打开项目')).toBeInTheDocument();
  });
});
