export default function IdeaCard({ title, desc }) {
  return (
    <div className="border border-slate-700 p-4 rounded">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-slate-400">{desc}</p>
    </div>
  );
}
