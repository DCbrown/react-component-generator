import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert the File to a Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const response = await openai.audio.transcriptions.create({
      file: new File([buffer], "audio.webm", { type: "audio/webm" }),
      model: "whisper-1",
    });

    return NextResponse.json({ text: response.text });
  } catch (error: unknown) {
    console.error("Transcription error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
