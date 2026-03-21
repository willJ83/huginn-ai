import mammoth from "mammoth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.extractRawText({
      buffer: Buffer.from(arrayBuffer),
    });

    return NextResponse.json({
      text: result.value,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to parse DOCX" },
      { status: 500 }
    );
  }
}