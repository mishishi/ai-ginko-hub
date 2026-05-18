import { useEffect, useRef } from 'react';

interface Props {
  projectId: string;
}

export default function CommentsSection({ projectId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://utteranc.es/client.js';
    script.setAttribute('repo', 'mishishi/ginko-hub-comments');
    script.setAttribute('issue-term', `project-${projectId}`);
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('crossOrigin', 'anonymous');
    script.async = true;

    containerRef.current.appendChild(script);
  }, [projectId]);

  return (
    <section aria-labelledby="comments-heading">
      <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-border">
        <h2 id="comments-heading" className="font-heading text-2xl text-text-primary">
          评论
        </h2>
      </div>
      <div
        ref={containerRef}
        className="bg-bg-card border border-border rounded-xl p-6"
        aria-label="评论区"
        role="region"
      />
    </section>
  );
}
