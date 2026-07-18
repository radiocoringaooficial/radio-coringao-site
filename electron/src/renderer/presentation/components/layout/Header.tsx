import { useAuthStore } from '@/presentation/stores/auth-store';

export function Header() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="h-14 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-headline font-bold text-on-surface">{user?.name}</p>
          <p className="text-xs font-body text-on-surface-variant">{user?.role}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-headline font-bold text-white">
              {user?.name?.charAt(0) || 'A'}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
