let id = 0;
const uid = () => String(++id);

export function mockParse(src) {
  return {
    ast: {
      id: uid(),
      type: "Program",
      children: [
        {
          id: uid(),
          type: "Assignment",
          children: [
            { id: uid(), type: "Identifier" },
            { id: uid(), type: "NumberLiteral" },
          ],
        },
      ],
    },
  };
}
