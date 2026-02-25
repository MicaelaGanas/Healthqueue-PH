const instructions = [
  "Please wait for further instructions, you will be notified until further notice",
  "When called for your turn, head immediately to the designated area, you are only given 5 minutes until the next number is called",
];

export function Instructions() {
  return (
    <section className="mt-8" aria-labelledby="instructions-heading">
      <h2 id="instructions-heading" className="text-lg font-bold text-[#333333]" style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
        Instructions
      </h2>
      <ul className="mt-3 list-inside list-disc space-y-2 text-[#333333]">
        {instructions.map((text, i) => (
          <li key={i} className="text-sm leading-relaxed">
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
