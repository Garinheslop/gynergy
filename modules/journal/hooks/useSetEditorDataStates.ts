import { useEffect, useState } from "react";

const useSetEditorData = <T>({ data }: { data: T | null }) => {
  const [editorData, setEditorData] = useState<T | null>(data);

  useEffect(() => {
    if (data) {
      setEditorData(data);
    }
  }, [data]);

  const updateEditorField = <K extends keyof T>(field: K, value: T[K]) => {
    setEditorData((prev) => {
      if (!prev) {
        return { [field]: value } as T;
      }
      return { ...prev, [field]: value };
    });
  };

  const resetEditor = () => {
    setEditorData(null);
  };

  return { editorData, updateEditorField, setEditorData, resetEditor };
};

export default useSetEditorData;
