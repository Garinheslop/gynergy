export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient, createServiceClient } from "@lib/supabase-server";
import { profileRequestTypes } from "@resources/types/profile";
import { uploadFileToStorage } from "app/api/upload/controller";

type UserProfileData = {
  userId: string;
};
type UserUpdateData = {
  userId: string;
  firstName: string;
  lastName: string;
  imageFile: {
    fileStr: string;
    name: string;
    contentType: string;
  };
};

type UserUpdateImage = {
  userId: string;
  name: string;
  fileStr: string;
  contentType: string;
};

export async function GET(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is requried" }, { status: 401 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log({ authError });
  console.log({ user });

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let fetcherHandler: ((args: Partial<UserProfileData>) => Promise<any>) | null = null;
  let args: Partial<UserProfileData> | {} = {};
  const responseName = "user";

  if (requestType === profileRequestTypes.userProfile) {
    fetcherHandler = getUserData;
    args = {
      userId: user.id,
    };
  }
  if (!fetcherHandler || !responseName) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }
  const data = await fetcherHandler(args);
  if (data?.error) {
    return NextResponse.json({ error: { message: data?.error } }, { status: 500 });
  } else {
    return NextResponse.json({
      [responseName]: data,
    });
  }
}

export async function PUT(request: Request, { params }: { params: { requestType: string } }) {
  const { requestType } = params;

  if (!requestType) {
    return NextResponse.json({ error: "Request type is requried" }, { status: 404 });
  }

  const { firstName, lastName, fileStr, fileName, contentType } = await request.json();

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let fetcherHandler: ((args: Partial<UserProfileData>) => Promise<any>) | null = null;
  let args: Partial<UserProfileData> | {} = {};
  const responseName = "user";

  if (requestType === profileRequestTypes.updateUserData) {
    if (!firstName && !lastName && !fileStr && !fileName && !contentType) {
      return NextResponse.json({ error: "Invalid update body" }, { status: 400 });
    }
    fetcherHandler = updateUserProfile;
    args = { userId: user.id };
    if (firstName && lastName) {
      args = {
        ...args,
        firstName,
        lastName,
      };
    }
    if (fileStr && fileName && contentType) {
      args = {
        ...args,
        imageFile: {
          fileStr,
          name: fileName,
          contentType,
        },
      };
    }
  }

  if (!fetcherHandler || !responseName) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }
  const data = await fetcherHandler(args);
  if (data?.error) {
    return NextResponse.json({ error: { message: data?.error } }, { status: 500 });
  } else {
    return NextResponse.json({
      [responseName]: data,
    });
  }
}

const getUserData = async ({ userId }: Partial<UserProfileData>) => {
  console.log({ userId });

  const supabase = createClient();
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();

    if (error || !data) {
      return { error: error?.message || "User not found" };
    }

    return {
      id: data.id,
      supabaseId: data.supabase_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      profileImage: data.profile_image,
    };
  } catch (err: any) {
    return { error: err.message };
  }
};

const updateUserProfile = async ({
  userId,
  firstName,
  lastName,
  imageFile,
}: Partial<UserUpdateData>) => {
  try {
    const supabase = createClient();
    const supabaseAdmin = createServiceClient();
    let imagePath = null;
    if (imageFile && imageFile.fileStr) {
      if (!imageFile.fileStr || !imageFile.name || !imageFile.contentType) {
        return { error: "No image data provided" };
      } else {
        const path = await updateUserProfileImage({
          userId,
          fileStr: imageFile.fileStr,
          name: imageFile.name,
          contentType: imageFile.contentType,
        });
        if (typeof path === "object" && path?.error) {
          return { error: path?.error };
        } else {
          imagePath = path;
        }
      }
    }
    const dataToUpdate: any = {
      first_name: firstName,
      last_name: lastName,
    };
    if (imagePath) {
      dataToUpdate.profile_image = imagePath;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...dataToUpdate,
        roles: ["user"],
      },
    });
    if (updateError) {
      return { error: updateError?.message || "User not found" };
    }
    const { data: updatedUserData, error: updatedUserDataError } = await supabaseAdmin
      .from("users")
      .update({
        ...dataToUpdate,
      })
      .eq("id", userId)
      .select()
      .single();
    if (updatedUserDataError) {
      return {
        error: updatedUserDataError?.message,
      };
    }

    return {
      id: updatedUserData.id,
      supabaseId: updatedUserData.supabase_id,
      firstName: updatedUserData.first_name,
      lastName: updatedUserData.last_name,
      email: updatedUserData.email,
      profileImage: updatedUserData.profile_image,
    };
  } catch (err: any) {
    return { error: err.message };
  }
};

const updateUserProfileImage = async ({
  userId,
  fileStr,
  name,
  contentType,
}: Partial<UserUpdateImage>) => {
  try {
    const supabase = createClient();
    if (!userId || !fileStr || !name || !contentType) {
      return { error: "No file data provided" };
    }
    const { data, error: _listError } = await supabase.storage
      .from(`${process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME}`)
      .list(`profiles/${userId}`, {
        limit: 10,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (data && data?.length > 0) {
      for (let i = 0; i < data.length; i++) {
        const { data: _deleteImageData, error: deleteError } = await supabase.storage
          .from(`${process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME}`)
          .remove([`profiles/${userId}/${data[i]?.name}`]);

        if (deleteError) {
          return { error: "Error deleting file" };
        }
      }
    }

    const base64Data = fileStr.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const path = await uploadFileToStorage({
      file: buffer,
      path: `profiles/${userId}`,
      name: name,
      contentType: `${contentType}`,
    });
    if (typeof path === "object" && path?.error) {
      return { error: path?.error };
    }
    return path;
  } catch (err: any) {
    return { error: err.message };
  }
};
