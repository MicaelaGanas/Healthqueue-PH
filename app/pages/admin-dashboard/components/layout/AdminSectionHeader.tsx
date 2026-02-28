type AdminSectionHeaderProps = {
  title: string;
  description?: string;
};

export function AdminSectionHeader({ title, description }: AdminSectionHeaderProps) {
  return (
    <div style={{ fontFamily: "var(--font-rosario), sans-serif" }}>
      <h2 className="text-xl font-bold text-[#333333] sm:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-0.5 text-sm text-[#6C757D]">{description}</p>
      ) : null}
    </div>
  );
}
