import React, { useRef, useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => <div className="h-40 border border-gray-200 bg-gray-50 animate-pulse rounded-md w-full" />,
});

const CustomJodit = ({ value, onChange }) => {
  const editor = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing...",
      height: 400,
      uploader: {
        insertImageAsBase64URI: true,
      },
      buttons: [
        "eraser",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "font",
        "fontsize",
        "brush",
        "|",
        "align",
        "|",
        "ul",
        "ol",
        "outdent",
        "indent",
        "|",
        "link",
        "image",
        "video",
        "table",
        "|",
        "source",
        "|",
        "fullsize",
      ],
      toolbarAdaptive: false,
    }),
    []
  );

  if (!isMounted) {
    return <div className="h-40 border border-gray-200 bg-gray-50 rounded-md w-full" />;
  }

  return (
    <JoditEditor
      ref={editor}
      value={value || ""}
      config={config}
      tabIndex={1}
      onBlur={(newContent) => onChange(newContent)} // preferred to use only this option to update the content for performance reasons
      onChange={(newContent) => {}}
    />
  );
};

export default CustomJodit;
