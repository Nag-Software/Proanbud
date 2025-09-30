import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const n8nWebhookUrl = "https://proanbud.app.n8n.cloud/webhook/f7666602-b37a-460f-a066-1dac1a92901c";

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await n8nResponse.json();
    console.log('N8N Response:', data);
    // Check if data has output field, if so return it, otherwise return data
    const aiResponse = data.output || data;
    console.log('AI Response:', aiResponse);
    return NextResponse.json(aiResponse, { status: n8nResponse.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch from n8n', details: String(error) }, { status: 500 });
  }
}
