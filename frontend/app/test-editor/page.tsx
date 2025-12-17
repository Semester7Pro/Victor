"use client";
import CollaborativeEditor from "@/components/CollaborativeEditor";

export default function TestEditor() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Test Collaborative Editor</h1>
      <div style={{ height: "70vh" }}>
        <CollaborativeEditor roomId="policy-draft-2024" user={{ name: "Riya" }} />
      </div>
    </div>
  );
}
