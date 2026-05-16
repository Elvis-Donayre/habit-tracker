import { useState, type ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
}

export function Tabs({
  tabs,
  defaultTab,
  variant = 'underline',
  children,
}: {
  tabs: Tab[];
  defaultTab?: string;
  variant?: 'underline' | 'pills';
  children: (activeTab: string) => ReactNode;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '');

  if (variant === 'pills') {
    return (
      <div>
        <div className="flex gap-1 p-1 bg-[var(--color-bg)] rounded-[var(--radius-md)] border border-[var(--color-border)] mb-6 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 text-[13px] font-medium whitespace-nowrap rounded-[var(--radius-sm)]
                transition-all duration-200 ease-out
                ${active === tab.id
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-xs)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]/60'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        {children(active)}
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-0.5 border-b border-[var(--color-border)] mb-6 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-3 text-[13px] font-medium whitespace-nowrap
              transition-colors duration-150
              ${active === tab.id
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }
              after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px]
              after:rounded-t-full after:transition-all after:duration-200 after:ease-out
              ${active === tab.id
                ? 'after:bg-[var(--color-accent)] after:scale-x-100'
                : 'after:bg-transparent after:scale-x-0 hover:after:scale-x-100 hover:after:bg-[var(--color-border)]'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
}
