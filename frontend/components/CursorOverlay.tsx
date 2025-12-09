"use client";

import React, { useEffect, useState } from "react";
import getCaretCoordinates from "textarea-caret";

interface CursorItem {
  id: number;
  name: string;
  color: string;
  index: number;
}

interface Props {
  awareness: any;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export default function CursorOverlay({ awareness, textareaRef }: Props) {
  const [cursors, setCursors] = useState<CursorItem[]>([]);

  useEffect(() => {
    const update = () => {
      const states = Array.from(awareness.getStates().entries()).map(([id, state]: [number, any]) => {
        const user = state.user ?? { name: "Anon", color: "#888" };
        const idx = state.cursor && typeof state.cursor.index === "number" ? state.cursor.index : 0;
        return {
          id,
          name: user.name,
          color: user.color,
          index: idx,
        } as CursorItem;
      });

      // filter out local client (optional) so you only see OTHER cursors
      const filtered = states.filter((c) => c.id !== awareness.clientID);
      setCursors(filtered);
    };

    awareness.on("change", update);
    update();

    return () => {
      awareness.off("change", update);
    };
  }, [awareness]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {cursors.map((c) => {
        const ta = textareaRef.current;
        if (!ta) return null;

        // get pixel coords; guard with try/catch
        let coords = { top: 0, left: 0 };
        try {
          coords = getCaretCoordinates(ta, c.index);
        } catch (e) {
          // ignore if caret calculation fails
        }

        return (
          <div
            key={c.id}
            style={{
              position: "absolute",
              transform: `translate(${coords.left}px, ${coords.top}px)`,
              zIndex: 40,
            }}
          >
            <div style={{ position: "relative", left: 0 }}>
              <div style={{ width: 2, height: 18, backgroundColor: c.color }} />
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  left: 6,
                  fontSize: 11,
                  color: c.color,
                  background: "white",
                  padding: "2px 6px",
                  borderRadius: 6,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                  whiteSpace: "nowrap",
                }}
              >
                {c.name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
