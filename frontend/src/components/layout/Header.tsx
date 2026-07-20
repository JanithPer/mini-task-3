import { NavLink } from 'react-router-dom'
import { UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/', label: 'Search', end: true },
  { to: '/stats', label: 'Stats', end: false },
]

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-border bg-white/90 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="text-base font-semibold tracking-tight text-neutral-900">
            Retrieval Engine
          </NavLink>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative pb-1 text-sm font-medium transition-colors',
                    isActive ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-[15px] left-0 right-0 h-[2px] rounded-full bg-neutral-900" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <button
          type="button"
          aria-label="Account"
          className="rounded-full p-1 text-neutral-700 hover:bg-neutral-100"
        >
          <UserCircle2 className="h-6 w-6" />
        </button>
      </div>
    </header>
  )
}
