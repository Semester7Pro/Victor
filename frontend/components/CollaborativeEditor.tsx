"use client";

import React, { useEffect, useRef } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { TextAreaBinding } from "y-textarea";
import getCaretCoordinates from "textarea-caret";
import { nanoid } from "nanoid";
import CursorOverlay from "./CursorOverlay";

interface User {
  name: string;
  color: string;
}

interface CollaborativeEditorProps {
  roomId: string;
  user?: Partial<User>; // optional, we'll generate defaults
}

export default function CollaborativeEditor({
  roomId,
  user = {},
}: CollaborativeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Create a Y.Doc per component instance
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // generate client id & default user
  const clientId = useRef(nanoid(6));
  const localUser = {
    name: user.name ?? `User-${clientId.current}`,
    color:
      user.color ??
      `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`,
  };

  useEffect(() => {
    // create doc + provider
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Use Yjs demo websocket for development. Replace with your server in prod.
    const wsUrl = "ws://localhost:1234";
    const provider = new WebsocketProvider(wsUrl, roomId, ydoc);
    providerRef.current = provider;

    // awareness setup: publish user info
    const awareness = provider.awareness;
    awareness.setLocalStateField("user", {
      name: localUser.name,
      color: localUser.color,
      id: clientId.current,
    });

    // ensure a ytext exists
    const ytext = ydoc.getText("shared-text");

    // Bind textarea <-> ytext using y-textarea
    if (textareaRef.current) {
      const binding = new TextAreaBinding(ytext, textareaRef.current);

      // cleanup binding on unmount
      provider.once("destroy", () => binding.destroy());
      // also destroy binding when component unmounts
      return () => {
        try {
          binding.destroy();
        } catch {}
      };
    }

    // cleanup provider + ydoc on unmount
    return () => {
      try {
        provider.disconnect();
        provider.destroy();
      } catch {}
      try {
        ydoc.destroy();
      } catch {}
    };
    // We intentionally want this effect to run only once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // update awareness cursor when selection changes
  const updateCursor = () => {
    const ta = textareaRef.current;
    const provider = providerRef.current;
    if (!ta || !provider) return;

    const index = ta.selectionStart ?? 0;
    provider.awareness.setLocalStateField("cursor", {
      index,
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* Uncontrolled textarea: YTextArea will manage DOM value */}
      <textarea
        ref={textareaRef}
        className="w-full h-full min-h-[420px] p-4 bg-white border rounded-md resize-none focus:outline-none text-gray-900"
        placeholder="Start drafting your policy document here..."
        onKeyUp={updateCursor}
        onClick={updateCursor}
        onSelect={updateCursor}
      />

      {/* cursor overlay reads provider.awareness */}
      {providerRef.current && (
        <CursorOverlay awareness={providerRef.current.awareness} textareaRef={textareaRef} />
      )}
    </div>
  );
}
