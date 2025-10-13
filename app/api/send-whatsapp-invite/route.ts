import { type NextRequest, NextResponse } from "next/server"

// API endpoint to send personalized WhatsApp invitations
export async function POST(request: NextRequest) {
  try {
    const { guestName, phoneNumber, seatCount } = await request.json()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wedding-invitation-final-zeta.vercel.app"

    if (!guestName || !phoneNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-$$$$]/g, "")

    const inviteMessage =
      `Hola ${guestName}!\n\n` +
      `Es con gran placer que Michelle y Andres los invitan a su boda.\n\n` +
      `FECHA: Sabado, 27 de Diciembre, 2025\n` +
      `CEREMONIA: 4:00 PM - Parroquia ONUVA\n` +
      `RECEPCION: 6:15 PM - Finca La Quadra\n\n` +
      `Tenemos ${seatCount} asiento${seatCount > 1 ? "s" : ""} reservado${seatCount > 1 ? "s" : ""} para ustedes.\n\n` +
      `Por favor confirmen su asistencia aqui: ${siteUrl}\n\n` +
      `Con amor,\n` +
      `Michelle y Andres`

    console.log(`Sending invitation to ${guestName} at ${cleanPhone}`)

    // Try Twilio first (for sandbox participants)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        await sendViaTwilioWhatsApp(cleanPhone, inviteMessage)
        return NextResponse.json({
          success: true,
          message: "WhatsApp invitation sent successfully via Twilio",
          method: "twilio",
        })
      } catch (twilioError) {
        console.log("Twilio failed (probably not in sandbox), falling back to WhatsApp Web link")

        // Fallback: Generate WhatsApp Web link
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(inviteMessage)}`

        return NextResponse.json({
          success: false,
          message: "Generated WhatsApp Web link (recipient not in Twilio sandbox)",
          whatsappUrl: whatsappUrl,
          method: "web-link",
          instructions: "Click the link to open WhatsApp and send manually",
        })
      }
    } else {
      // No Twilio configured, use WhatsApp Web link
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(inviteMessage)}`

      return NextResponse.json({
        success: false,
        message: "WhatsApp Web link generated",
        whatsappUrl: whatsappUrl,
        method: "web-link",
      })
    }
  } catch (error) {
    console.error("Error sending WhatsApp invitation:", error)
    return NextResponse.json(
      {
        error: "Failed to send invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function sendViaTwilioWhatsApp(phone: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: fromWhatsApp,
      To: `whatsapp:${phone}`,
      Body: message,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Twilio error:", errorText)
    throw new Error(`Twilio WhatsApp error: ${errorText}`)
  }

  const result = await response.json()
  console.log("WhatsApp sent successfully via Twilio:", result.sid)
}
