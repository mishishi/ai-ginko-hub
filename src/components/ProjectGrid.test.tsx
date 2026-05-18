import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProjectGrid from './ProjectGrid';
import ProjectCard from './ProjectCard';
import type { Project } from '../types';

// Mock ProjectCard to avoid react-router-dom dependency
vi.mock('./ProjectCard', () => ({
  default: vi.fn(({ project }) => (
    <div data-testid="project-card">{project.name}</div>
  )),
}));

const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  description: 'A test project description',
  tags: ['react', 'typescript'],
  url: 'https://example.com',
  repoUrl: 'https://github.com/example/repo',
  createdAt: '2024-01-01',
  featured: false,
};

describe('ProjectGrid', () => {
  it('renders skeleton loading state when isLoading=true', () => {
    render(<ProjectGrid projects={[]} loading={true} />);

    // Should render 6 skeleton cards (Array(6))
    const skeletons = screen.getAllByText((content, element) => {
      // Match the pulse animation divs inside skeleton cards
      return element?.classList?.contains('animate-pulse') ?? false;
    });
    expect(skeletons.length).toBe(6);
  });

  it('renders project cards when projects loaded', () => {
    const projects: Project[] = [mockProject];
    render(<ProjectGrid projects={projects} loading={false} />);

    // ProjectCard is mocked, so we check it was rendered with correct data
    expect(screen.getAllByTestId('project-card')).toHaveLength(1);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders empty state when projects=[] and !isLoading', () => {
    render(<ProjectGrid projects={[]} loading={false} />);

    expect(screen.getByText('没有匹配的项目')).toBeInTheDocument();
    expect(screen.getByText('试试其他筛选条件')).toBeInTheDocument();
  });

  it('load more button present when hasMore=true', () => {
    render(<ProjectGrid projects={[mockProject]} loading={false} hasMore={true} />);

    const loadMoreButton = screen.getByRole('button', { name: '加载更多项目' });
    expect(loadMoreButton).toBeInTheDocument();
  });

  it('calls onLoadMore when load more clicked', async () => {
    const onLoadMore = vi.fn();
    render(
      <ProjectGrid
        projects={[mockProject]}
        loading={false}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    );

    const loadMoreButton = screen.getByRole('button', { name: '加载更多项目' });
    await userEvent.click(loadMoreButton);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
