import { type NextRequest, NextResponse } from "next/server"

// Generate WhatsApp links for bulk sending
export async function POST(request: NextRequest) {
  try {
    const { guests } = await request.json()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wedding-invitation-final-zeta.vercel.app"

    if (!guests || !Array.isArray(guests)) {
      return NextResponse.json({ error: "Guest list is required" }, { status: 400 })
    }

    console.log(`Generating WhatsApp links for ${guests.length} guests`)

    const whatsappLinks = guests.map((guest: any) => {
      const cleanPhone = guest.phone.replace(/[\s\-$$$$]/g, "")

      const inviteMessage =
        `Hola ${guest.name}!\n\n` +
        `Es con gran placer que Michelle y Andres los invitan a su boda.\n\n` +
        `FECHA: Sabado, 15 de Agosto, 2025\n` +
        `CEREMONIA: 4:00 PM - Capilla Santa Maria\n` +
        `RECEPCION: 6:30 PM - Club Campestre Riverside\n\n` +
        `Tenemos ${guest.seatCount} asiento${guest.seatCount > 1 ? "s" : ""} reservado${guest.seatCount > 1 ? "s" : ""} para ustedes.\n\n` +
        `Por favor confirmen su asistencia aqui: ${siteUrl}\n\n` +
        `Con amor,\n` +
        `Michelle y Andres`

      return {
        guest: guest.name,
        phone: guest.phone,
        cleanPhone: cleanPhone,
        whatsappUrl: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(inviteMessage)}`,
        message: inviteMessage,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Generated ${whatsappLinks.length} WhatsApp links`,
      links: whatsappLinks,
      instructions: {
        step1: "Click each link to open WhatsApp",
        step2: "Press Send in WhatsApp (message is pre-filled)",
        step3: "Mark as sent in the dashboard",
        automation: "Use the auto-clicker feature for faster sending",
      },
    })
  } catch (error) {
    console.error("Error generating WhatsApp links:", error)
    return NextResponse.json(
      {
        error: "Failed to generate WhatsApp links",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
