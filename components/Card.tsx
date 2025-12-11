export default function Card({ title, children, right }: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-[#0f192a] border border-[#112136] rounded-xl shadow-lg shadow-black/40">
      {title && (
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="text-sm text-slate-300">{title}</div>
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )}
