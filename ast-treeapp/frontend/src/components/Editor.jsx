export default function Editor({ title, subtitle, value, onChange }) {
  return (
    <div>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-slate-400">{subtitle}</p>
      <textarea
        className="w-full h-32 mt-2 p-2 bg-slate-900 border border-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
