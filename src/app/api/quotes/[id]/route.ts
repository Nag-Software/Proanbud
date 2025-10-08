import { NextRequest, NextResponse } from 'next/server';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);

    if (!usersSnapshot.exists()) {
      return NextResponse.json(
        { error: 'Ingen brukere funnet' },
        { status: 404 }
      );
    }

    let foundQuote: any = null;
    let foundUserId: string | null = null;

    // Search through all users' quotes
    usersSnapshot.forEach((userSnapshot) => {
      const userId = userSnapshot.key;
      const userData = userSnapshot.val();
      
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
      const settingsRef = ref(db, `users/${foundUserId}/innstillinger/bedrift`);
      const settingsSnapshot = await get(settingsRef);
      if (settingsSnapshot.exists()) {
        businessSettings = settingsSnapshot.val();
      }
    }

    // Get customer info
    let customerInfo = null;
    if (foundUserId && foundQuote.kundenavn) {
      const customersRef = ref(db, `users/${foundUserId}/kunder`);
      const customersSnapshot = await get(customersRef);
      if (customersSnapshot.exists()) {
        const customers = customersSnapshot.val();
        // Find customer by name
        Object.entries(customers).forEach(([customerId, customer]: [string, any]) => {
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
