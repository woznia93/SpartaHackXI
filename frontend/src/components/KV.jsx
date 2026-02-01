export default function KV({ k, v }) {
  return (
    <div className="text-sm">
      <strong>{k}:</strong> {v}
    </div>
  );
}
