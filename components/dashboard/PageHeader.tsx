interface PageHeaderProps {
  title: string;
  description: string;
  badge?: string;
}

export default function PageHeader({ title, description, badge }: PageHeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-white font-semibold text-lg">{title}</h1>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
      {badge !== undefined && (
        <span className="text-slate-500 text-sm">{badge}</span>
      )}
    </header>
  );
}
