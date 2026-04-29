import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

async function requireEditor(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "admin" && user.role !== "editor")) return null;
  return session.user;
}

export async function POST(request: Request) {
  const user = await requireEditor(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const { url } = await uploadImageToCloudinary(file, file.name || "cover.jpg");
    return NextResponse.json({ url });
  } catch (error) {
    console.error("upload-cover route error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

