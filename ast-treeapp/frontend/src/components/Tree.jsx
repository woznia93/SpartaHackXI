import { useState } from "react";

export default function Tree({ node, selectedId, onSelect }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="ml-4">
      <div
        onClick={() => onSelect(node)}
        className="cursor-pointer hover:text-blue-400"
      >
        {node.type}
      </div>

      {open && node.children?.map((c) => (
        <Tree key={c.id} node={c} onSelect={onSelect} />
      ))}
    </div>
  );
}
