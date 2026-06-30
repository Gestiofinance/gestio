export default function AuthLayout({ children }) {
  return (
    <div className="min-h-full flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Gestio</h1>
          <p className="text-lg text-white/80">
            Tout votre business, un seul outil.
          </p>
          <p className="mt-6 text-sm text-white/60">
            Gérez vos clients, projets, factures et finances depuis une
            plateforme unique, conçue pour les entrepreneurs africains.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
