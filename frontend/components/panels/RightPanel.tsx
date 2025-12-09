"use client";

import { useState } from "react";
import { Save, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CollaborativeEditor from "@/components/CollaborativeEditor";

export function RightPanel() {
  const [title, setTitle] = useState("Education Policy Draft 2024");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">
          Smart Notes & Draft Editor
        </h2>
      </div>

      {/* Title Input */}
      <div className="p-4 border-b border-gray-200">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-semibold bg-white border-gray-300 text-gray-900"
        />
      </div>

      {/* Collaborative Editor */}
      <div className="flex-1 p-4">
        <CollaborativeEditor
          roomId="policy-draft-2024"
          user={{ name: "Riya", color: "#007bff" }}
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3 bg-white">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-100"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Insights
          </Button>

          <Button
            variant="outline"
            className="flex-1 border-gray-300 text-gray-900 hover:bg-gray-100"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Check
          </Button>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </Button>
      </div>
    </div>
  );
}
