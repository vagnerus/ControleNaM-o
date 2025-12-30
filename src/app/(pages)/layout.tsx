export default function PagesLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="flex h-full flex-col">
          {children}
      </div>
    );
  }
  