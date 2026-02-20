"use client";

import { useState } from "react";
import { Users, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CenterPanel() {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      user: "Sarah K.",
      avatar: "SK",
      text: "I think we should focus on the implementation timeline first.",
      time: "10:30 AM",
    },
    {
      id: 2,
      user: "John D.",
      avatar: "JD",
      text: "Agreed. We also need to consider the budget allocations.",
      time: "10:32 AM",
    },
  ]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Collaborative Chat Space</h2>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-xs text-gray-600">3 active</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  {msg.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{msg.user}</span>
                  <span className="text-[10px] text-gray-500">{msg.time}</span>
                </div>
                <p className="text-sm text-gray-700">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
          />
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}