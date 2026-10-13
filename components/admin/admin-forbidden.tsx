import Link from 'next/link';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { getAdminHomeHref } from '../../lib/admin-access';
import type { AdminSessionUser } from '../../lib/cms-auth';

export function AdminForbidden({ user }: { user: Pick<AdminSessionUser, 'canManagePosts' | 'canManageSettings' | 'canManageAccess'> }) {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-[#f3eee5] text-[#a77919]"><LockKeyhole size={23} /></div>
      <h1 className="mt-5 text-2xl font-bold">Acesso não autorizado</h1>
      <p className="mt-2 text-sm leading-6 text-[#77716b]">Sua conta não tem permissão para acessar esta área.</p>
        <Link href={getAdminHomeHref({ posts: user.canManagePosts, settings: user.canManageSettings, access: user.canManageAccess })} className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#c89223] px-4 text-sm font-semibold text-[#120e0e] hover:bg-[#b48838]">
        <ArrowLeft size={16} /> Voltar ao painel
      </Link>
    </section>
  );
}
