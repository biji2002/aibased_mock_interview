export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    return Response.json({
      success: true,
      received: body,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    data: "Thank you!",
  });
}
