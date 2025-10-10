import { type NextRequest, NextResponse } from "next/server"

// Bulk invitation sender using Twilio WhatsApp Business API
export async function POST(request: NextRequest) {
  try {
    const { guests } = await request.json()

    if (!guests || !Array.isArray(guests)) {
      return NextResponse.json({ error: "Guest list is required" }, { status: 400 })
    }

    console.log(`Starting bulk invitation send for ${guests.length} guests`)

    // Check Twilio credentials
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_WHATSAPP_NUMBER) {
      return NextResponse.json({ error: "Twilio WhatsApp not configured" }, { status: 500 })
    }

    const results = []
    const errors = []

    // Send invitations with small delays to avoid rate limits
    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i]

      try {
        // Add small delay between messages (Twilio allows 1 msg/second)
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1100)) // 1.1 second delay
        }

        const result = await sendWhatsAppInvitation(guest)
        results.push({
          guest: guest.name,
          phone: guest.phone,
          status: "sent",
          messageId: result.sid,
        })

        console.log(`✅ Sent to ${guest.name} (${i + 1}/${guests.length})`)
      } catch (error) {
        console.error(`❌ Failed to send to ${guest.name}:`, error)
        errors.push({
          guest: guest.name,
          phone: guest.phone,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log(`Bulk send complete: ${results.length} sent, ${errors.length} failed`)

    return NextResponse.json({
      success: true,
      message: `Invitations sent to ${results.length} guests`,
      results: {
        sent: results,
        failed: errors,
        total: guests.length,
        successRate: `${Math.round((results.length / guests.length) * 100)}%`,
      },
    })
  } catch (error) {
    console.error("Bulk invitation error:", error)
    return NextResponse.json(
      {
        error: "Failed to send bulk invitations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function sendWhatsAppInvitation(guest: { name: string; phone: string; seatCount: number }) {
  const cleanPhone = guest.phone.replace(/[\s\-$$$$]/g, "")

  const inviteMessage =
    `Hola ${guest.name}!\n\n` +
    `Es con gran placer que Michelle y Andres los invitan a su boda.\n\n` +
    `FECHA: Sabado, 27 de Diciembre, 2025\n` +
    `CEREMONIA: 4:00 PM - Parroquia ONUVA\n` +
    `RECEPCION: 6:15 PM - Finca La Quadra\n\n` +
    `Tenemos ${guest.seatCount} asiento${guest.seatCount > 1 ? "s" : ""} reservado${guest.seatCount > 1 ? "s" : ""} para ustedes.\n\n` +
    `Por favor confirmen su asistencia aqui: ${process.env.NEXT_PUBLIC_SITE_URL}\n\n` +
    `Con amor,\n` +
    `Michelle y Andres`

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: fromWhatsApp,
      To: `whatsapp:${cleanPhone}`,
      Body: inviteMessage,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Twilio error: ${errorText}`)
  }

  const result = await response.json()
  return result
}
