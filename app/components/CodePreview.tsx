import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live";
import React from "react";

interface CodePreviewProps {
  code: string;
}

export default function CodePreview({ code }: CodePreviewProps) {
  return (
    <LiveProvider code={code} scope={{ React }}>
      <div className="bg-gray-800 p-5 rounded-lg w-full">
        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Preview</h3>
          <div className="bg-white text-black p-4 rounded">
            <LivePreview />
          </div>
          <LiveError className="text-red-500 mt-2" />
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">Code</h3>
          <LiveEditor
            className="bg-gray-900 p-4 rounded-lg font-mono text-sm"
            style={{ fontFamily: "monospace" }}
          />
        </div>
      </div>
    </LiveProvider>
  );
}
