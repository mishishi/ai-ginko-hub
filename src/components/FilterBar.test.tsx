import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterBar from './FilterBar';
import type { SortOption } from './FilterBar';

const mockOnTagChange = vi.fn();
const mockOnSortChange = vi.fn();
const mockOnFeaturedChange = vi.fn();

const defaultProps = {
  tags: ['react', 'typescript', 'vite'],
  activeTag: null as string | null,
  sort: 'default' as SortOption,
  featuredOnly: false,
  onTagChange: mockOnTagChange,
  onSortChange: mockOnSortChange,
  onFeaturedChange: mockOnFeaturedChange,
};

describe('FilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all passed tags', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('vite')).toBeInTheDocument();
  });

  it('renders the "全部" (all) button', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText('全部')).toBeInTheDocument();
  });

  it('calls onTagChange when a tag is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} />);
    await user.click(screen.getByText('typescript'));
    expect(mockOnTagChange).toHaveBeenCalledWith('typescript');
  });

  it('calls onTagChange with null when already-active tag is clicked (toggle off)', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} activeTag="react" />);
    await user.click(screen.getByText('react'));
    expect(mockOnTagChange).toHaveBeenCalledWith(null);
  });

  it('active tag has aria-pressed true', () => {
    render(<FilterBar {...defaultProps} activeTag="typescript" />);
    const activeButton = screen.getByRole('button', { name: 'typescript' });
    expect(activeButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('inactive tag has aria-pressed false', () => {
    render(<FilterBar {...defaultProps} activeTag="react" />);
    const inactiveButton = screen.getByRole('button', { name: 'typescript' });
    expect(inactiveButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onSortChange when sort dropdown changes', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} />);
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'name');
    expect(mockOnSortChange).toHaveBeenCalledWith('name');
  });

  it('calls onFeaturedChange when featured toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} />);
    const featuredButton = screen.getByRole('button', { name: /精选/ });
    await user.click(featuredButton);
    expect(mockOnFeaturedChange).toHaveBeenCalledWith(true);
  });

  it('featured toggle is off by default (aria-pressed false)', () => {
    render(<FilterBar {...defaultProps} />);
    const featuredButton = screen.getByRole('button', { name: /精选/ });
    expect(featuredButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('featured toggle is on when featuredOnly is true (aria-pressed true)', () => {
    render(<FilterBar {...defaultProps} featuredOnly={true} />);
    const featuredButton = screen.getByRole('button', { name: /精选/ });
    expect(featuredButton).toHaveAttribute('aria-pressed', 'true');
  });
});
