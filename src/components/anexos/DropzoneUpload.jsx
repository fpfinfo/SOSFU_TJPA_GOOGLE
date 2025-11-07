import React from "react";
import { Upload } from "lucide-react";

export default function DropzoneUpload({
  onFiles,
  disabled = false,
  accept = "*",
  title = "Arraste arquivos ou clique para anexar",
  note = "",
  className = ""
}) {
  const inputRef = React.useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const openPicker = () => !disabled && inputRef.current?.click();

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length && onFiles) onFiles(files);
    e.target.value = "";
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length && onFiles) onFiles(files);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer relative ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-500"} ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
      onClick={openPicker}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
    >
      <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
      <p className="text-gray-700">{title}</p>
      {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
      <input
        ref={inputRef}
        type="file"
        multiple
        disabled={disabled}
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}