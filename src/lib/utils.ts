/**
 * Class-name utility — joint conditional Tailwind classes zonder de extra
 * dependency van clsx + tailwind-merge. Filters out falsy values.
 *
 * Usage:
 *   cn('px-4', isActive && 'bg-purple', someClass)
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
