export default function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center text-neutral-500">
      {children}
    </main>
  );
}
