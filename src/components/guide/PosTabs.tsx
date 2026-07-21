import type { PosKey } from '@/types/guide';
import { useGuideContent } from '@/hooks/useGuideContent';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BRAND_RED } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface PosTabsProps {
  value: PosKey;
  onChange: (value: PosKey) => void;
}

export function PosTabs({ value, onChange }: PosTabsProps) {
  const { posTabs } = useGuideContent();

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as PosKey)}>
      <TabsList className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0">
        {posTabs.map(({ key, label }) => (
          <TabsTrigger
            key={key}
            value={key}
            className={cn(
              'rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none',
            )}
            style={
              value === key
                ? { borderBottomColor: BRAND_RED, color: BRAND_RED }
                : undefined
            }
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
