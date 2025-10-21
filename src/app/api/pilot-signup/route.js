import { NextResponse } from 'next/server';

import fs from 'fs';

import path from 'path';

export async function POST(request) {

  const data = await request.json();

  // Simple validation

  if (!data.email || !data.firma) {

    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  }

  // Save to JSON file

  const filePath = path.join(process.cwd(), 'leads.json');

  let leads = [];

  if (fs.existsSync(filePath)) {

    leads = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  }

  leads.push({ ...data, timestamp: new Date().toISOString() });

  fs.writeFileSync(filePath, JSON.stringify(leads, null, 2));

  // Send to webhook if set

  if (process.env.WEBHOOK_URL) {

    await fetch(process.env.WEBHOOK_URL, {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify(data),

    });

  }

  // Stub email

  console.log(`Send email to ${data.email} with agreement`);

  return NextResponse.json({ success: true });

}