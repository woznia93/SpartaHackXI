export default function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded ${
        active ? "bg-slate-200 text-black" : "bg-slate-800"
      }`}
    >
      {label}
    </button>
  );
}
