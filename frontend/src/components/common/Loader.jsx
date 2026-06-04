export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
      <div className="w-10 h-10 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      <p className="text-white/40 text-sm font-body">{text}</p>
    </div>
  );
}
