export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();

  return Response.json({
    success: true,
    received: body,
  });
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" });
}
