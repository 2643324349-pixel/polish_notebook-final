import type { InvariableCategory } from '@/types/guide';

interface InvariableWordListProps {
  categories: InvariableCategory[];
}

export function InvariableWordList({ categories }: InvariableWordListProps) {
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div
          key={category.title}
          className="rounded-2xl border bg-card p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold">{category.title}</h3>
          {category.description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {category.description}
            </p>
          ) : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {category.items.map((item) => (
              <div
                key={item.polish}
                className="flex items-baseline justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2"
              >
                <span className="font-mono text-sm">{item.polish}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {item.translation}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
