import { User } from "@supabase/supabase-js";

import { createClient } from "@lib/supabase-server";

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
  file: Buffer | ArrayBuffer | Uint8Array;
  name?: string;
  path: string;
  contentType: string | null;
}): Promise<string | { error: string }> => {
  const supabase = createClient();

  if (!file || !path) {
    return { error: "No file data provided" };
  }

  const buffer = file instanceof Buffer ? file : Buffer.from(new Uint8Array(file));
  const fileName = `${path}/${name ?? `${Date.now()}.jpeg`}`;
  const { data, error } = await supabase.storage.from("gynergy").upload(fileName, buffer, {
    contentType: contentType ?? "image/jpeg",
  });
  if (error) {
    return { error: error.message };
  }
  return data.path;
};
