import { APP_NAME, APP_LOGO_SRC } from '@/lib/constants';
import { cn } from '@/lib/utils';

type AppLogoSize = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<AppLogoSize, string> = {
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
};

interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
}

export function AppLogo({ size = 'md', className }: AppLogoProps) {
  return (
    <img
      src={APP_LOGO_SRC}
      alt={APP_NAME}
      className={cn('shrink-0 object-contain', SIZE_CLASS[size], className)}
    />
  );
}
