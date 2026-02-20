export default function SectionTransition() {
  return (
    <div className="relative h-32 bg-white rounded-b-[74px] border-2 overflow-hidden">
      {/* curved paper edge */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140%] h-40 bg-[#F6F4F1] rounded-t-[100%]" />
    </div>
  );
}
