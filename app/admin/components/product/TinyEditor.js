"use client";

import React, { useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";

import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autolink";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/plugins/image";
import "tinymce/plugins/charmap";
import "tinymce/plugins/preview";
import "tinymce/plugins/anchor";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/media";
import "tinymce/plugins/table";
import "tinymce/plugins/help";
import "tinymce/plugins/wordcount";
import "tinymce/plugins/directionality";

const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  { ssr: false }
);

const TinyEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);

  const init = useMemo(
    () => ({
      height: 400,
      menubar: true,
      license_key: "gpl",
      plugins:
        "advlist autolink lists link image charmap preview anchor " +
        "searchreplace visualblocks code fullscreen " +
        "insertdatetime media table help wordcount directionality",
      toolbar:
        "undo redo | formatselect | bold italic underline strikethrough | " +
        "alignleft aligncenter alignright alignjustify | " +
        "bullist numlist outdent indent | removeformat | code preview | ltr rtl",
      directionality: "ltr",
      branding: false,
      inline: false,
      base_url: "/tinymce",
      suffix: ".min",
      content_style:
        "body { font-family: Poppins, sans-serif; font-size:14px; direction: ltr; unicode-bidi: embed; }",
    }),
    []
  );

  const handleEditorChange = useCallback(
    (content) => {
      if (typeof onChange === "function") {
        onChange({ target: { name: "description", value: content } });
      }
    },
    [onChange]
  );

  return (
    <div className="my-4">
      <Editor
        apiKey="" // self-hosted
        onInit={(evt, editor) => (editorRef.current = editor)}
        value={value ?? ""}
        init={init}
        onEditorChange={handleEditorChange}
      />
    </div>
  );
};

export default TinyEditor;
