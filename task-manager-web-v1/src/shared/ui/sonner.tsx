import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import { useTheme } from '@/shared/theme/useTheme'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

/*
 * Primitive shadcn/ui, amputée de sa dépendance à next-themes : l'application n'a pas
 * encore de bascule de thème (bonus B-02) et une dépendance inutilisée est du poids mort
 * (INV-24). Les couleurs viennent des tokens, donc la bascule de thème fonctionnera
 * telle quelle le jour où B-02 sera lancé.
 */
const Toaster = (props: ToasterProps) => (
  <ThemedSonner
    className="toaster group"
    position="top-right"
    icons={{
      success: <CircleCheckIcon className="size-4" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    style={
      {
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--popover-foreground)',
        '--normal-border': 'var(--border)',
        '--border-radius': 'var(--radius)',
      } as CSSProperties
    }
    {...props}
  />
)

/** Les notifications suivent le thème de l'application (bonus B-02). */
function ThemedSonner(props: ToasterProps) {
  const { theme } = useTheme()
  return <Sonner theme={theme} {...props} />
}

export { Toaster }
