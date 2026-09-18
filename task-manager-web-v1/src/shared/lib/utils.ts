import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Fusionne des classes Tailwind en résolvant les conflits (la dernière gagne). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
