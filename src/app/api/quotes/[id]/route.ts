import { NextRequest, NextResponse } from 'next/server';
import { database as adminDatabase } from '@/lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let db = adminDatabase;
    if (!db) {
      // Try to initialize database on demand
      if (admin.apps.length > 0) {
        try {
          db = admin.database();
          console.log('✅ Database initialized on demand');
        } catch (error) {
          console.error('❌ Failed to initialize database on demand:', error);
          return NextResponse.json(
            { error: 'Database ikke tilgjengelig' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Database ikke tilgjengelig' },
          { status: 500 }
        );
      }
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token er påkrevd' },
        { status: 401 }
      );
    }

    // Search for quote with matching ID and token across all users
    const usersRef = db.ref('users');
    const usersSnapshot = await usersRef.once('value');

    if (!usersSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Ingen brukere funnet' },
        { status: 404 }
      );
    }

    let foundQuote: any = null;
    let foundUserId: string | null = null;

    // Search through all users' quotes
    const usersData = usersSnapshot.val();
    Object.entries(usersData || {}).forEach(([userId, userData]: [string, any]) => {
      if (userData.tilbud && userData.tilbud[id]) {
        const quote = userData.tilbud[id];
        // Verify token matches
        if (quote.viewToken === token) {
          foundQuote = {
            id,
            ...quote,
            userId,
          };
          foundUserId = userId;
        }
      }
    });

    if (!foundQuote) {
      return NextResponse.json(
        { error: 'Tilbud ikke funnet eller ugyldig token' },
        { status: 404 }
      );
    }

    // Get business settings for the user
    let businessSettings = null;
    if (foundUserId) {
      // Try new location first
      let settingsRef = db.ref(`users/${foundUserId}/businessSettings`);
      let settingsSnapshot = await settingsRef.once('value');
      
      if (settingsSnapshot.exists()) {
        businessSettings = settingsSnapshot.val();
        console.log('✅ Business settings found at businessSettings');
      } else {
        // Fallback to old location for backwards compatibility
        settingsRef = db.ref(`users/${foundUserId}/innstillinger/bedrift`);
        settingsSnapshot = await settingsRef.once('value');
        if (settingsSnapshot.exists()) {
          businessSettings = settingsSnapshot.val();
          console.log('✅ Business settings found at innstillinger/bedrift');
        } else {
          console.log('⚠️ No business settings found for user:', foundUserId);
        }
      }
    }

    // Get customer info
    let customerInfo = null;
    if (foundUserId && foundQuote.kundenavn) {
      const customersRef = db.ref(`users/${foundUserId}/kunder`);
      const customersSnapshot = await customersRef.once('value');
      if (customersSnapshot.exists()) {
        const customers = customersSnapshot.val();
        // Find customer by name
        Object.entries(customers || {}).forEach(([customerId, customer]: [string, any]) => {
          if (customer.navn === foundQuote.kundenavn) {
            customerInfo = {
              id: customerId,
              ...customer,
            };
          }
        });
      }
    }

    return NextResponse.json({
      quote: foundQuote,
      businessSettings,
      customerInfo,
    });

  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Feil ved henting av tilbud' },
      { status: 500 }
    );
  }
}
