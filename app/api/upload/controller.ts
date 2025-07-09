import { createClient } from "@lib/supabase-server";
import { User } from "@supabase/supabase-js";

export const uploadToStorage = async ({
  user,
  fileStr,
  name,
  contentType,
  mimeType,
}: {
  user: User;
  fileStr: string;
  name: string;
  contentType: string;
  mimeType: string;
}) => {
  const supabase = createClient();

  if (!fileStr || !name || !contentType) {
    return { error: "No file data provided" };
  }

  if (!user) {
    return { error: "Unauthorized" };
  }

  const base64Data = fileStr.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const fileName = `${user.id}/${contentType}/${name}`;

  const { data, error } = await supabase.storage.from("gynergy").upload(fileName, buffer, {
    contentType: mimeType ?? "image/jpeg",
  });

  if (error) {
    console.error("Supabase upload error:", error);
    return { error };
  }
  return { path: data.fullPath };
};

export const uploadFileToStorage = async ({
  file,
  name,
  path,
  contentType,
}: {
  file: any;
  name?: string;
  path: string;
  contentType: string | null;
}) => {
  const supabase = createClient();

  if (!file || !path) {
    return { error: "No file data provided" };
  }

  const buffer = Buffer.from(file);
  const fileName = `${path}/${name ?? `${new Date().getTime()}.jpeg`}`;
  const { data, error } = await supabase.storage.from("gynergy").upload(fileName, buffer, {
    contentType: contentType ?? "image/jpeg",
  });
  if (error) {
    console.log("Supabase upload error:", error);
    return { error: error.message };
  }
  return data.path;
};
