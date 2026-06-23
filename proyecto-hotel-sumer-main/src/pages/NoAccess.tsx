import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { firstAccessiblePath, PRIMARY_NAV } from "../routes/access";

/**
 * Rendered in place of a page's content when the signed-in user lacks the
 * permission to view it (direct navigation to a gated route). The nav and
 * header stay mounted around it, so the user can move elsewhere. The CTA points
 * at the first page they actually have access to, which also covers the edge
 * case of a custom role that can't reach the default "/dashboard".
 */
const NoAccess = () => {
  const { has } = useAuth();
  const target = firstAccessiblePath(has);
  const targetLabel =
    PRIMARY_NAV.find((dest) => dest.to === target)?.label ?? "Mi perfil";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <h1 className="mb-2 font-serif text-2xl text-marine">Sin acceso</h1>
      <p className="mb-6 max-w-md text-slate-500">
        No tienes permiso para ver esta página. Si crees que es un error,
        contacta a un administrador.
      </p>

      <Link
        to={target}
        className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-marine px-5 py-2 font-medium text-white transition-colors hover:bg-marine-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marine focus-visible:ring-offset-2"
      >
        Ir a {targetLabel}
      </Link>
    </div>
  );
};

export default NoAccess;
