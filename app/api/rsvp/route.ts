import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

interface RSVPData {
  guestName: string
  attendance: string
  guestCount: string
  actualGuestCount: string
  message: string
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== RSVP API Called ===")

    const body: RSVPData = await request.json()
    console.log("Received data:", body)

    // Validate required fields
    if (!body.guestName || !body.attendance) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Nombre y asistencia son requeridos" }, { status: 400 })
    }

    // Get client info
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Parse seat counts
    const assignedSeats = Number.parseInt(body.guestCount) || 2
    const actualSeats = body.attendance === "yes" ? Number.parseInt(body.actualGuestCount) || assignedSeats : 0

    // Validate actual seats don't exceed assigned seats
    if (actualSeats > assignedSeats) {
      return NextResponse.json(
        {
          error: `No puedes seleccionar más asientos (${actualSeats}) de los que tienes asignados (${assignedSeats})`,
        },
        { status: 400 },
      )
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Supabase not configured")
      return NextResponse.json({ error: "Database not configured" }, { status: 500 })
    }

    // First, check if the actual_guest_count column exists
    let hasActualGuestCountColumn = true
    try {
      // Try to query the column to see if it exists
      const { error: columnCheckError } = await supabase.from("rsvps").select("actual_guest_count").limit(1)

      if (columnCheckError && columnCheckError.message.includes("actual_guest_count")) {
        hasActualGuestCountColumn = false
        console.log("actual_guest_count column doesn't exist yet")
      }
    } catch (error) {
      hasActualGuestCountColumn = false
      console.log("Error checking column existence:", error)
    }

    // Prepare data for database
    const rsvpData: any = {
      guest_name: body.guestName,
      attendance: body.attendance as "yes" | "no",
      guest_count: assignedSeats,
      message: body.message || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    }

    // Only add actual_guest_count if the column exists
    if (hasActualGuestCountColumn) {
      rsvpData.actual_guest_count = actualSeats
    }

    console.log("Prepared data for database:", rsvpData)

    // Save to Supabase
    console.log("Attempting to save to Supabase...")
    const { data, error } = await supabase.from("rsvps").insert([rsvpData]).select().single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json(
        {
          error: `Error de base de datos: ${error.message}`,
          details: error,
        },
        { status: 500 },
      )
    }

    console.log("=== RSVP SAVED SUCCESSFULLY ===")
    console.log("ID:", data.id)
    console.log("Guest Name:", data.guest_name)
    console.log("Attendance:", data.attendance)
    console.log("Assigned Seats:", data.guest_count)
    if (hasActualGuestCountColumn) {
      console.log("Actual Seats:", data.actual_guest_count)
    }
    console.log("================================")

    // Send WhatsApp notification to couple (if configured)
    if (process.env.COUPLE_WHATSAPP_NUMBER && process.env.TWILIO_ACCOUNT_SID) {
      try {
        await sendWhatsAppNotification({
          guestName: body.guestName,
          attendance: body.attendance,
          assignedSeats: assignedSeats,
          actualSeats: actualSeats,
          message: body.message,
          hasActualGuestCountColumn,
        })
      } catch (whatsappError) {
        console.error("WhatsApp error (non-critical):", whatsappError)
        // Don't fail the RSVP if WhatsApp fails
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "RSVP enviado exitosamente",
      data: {
        id: data.id,
        guestName: data.guest_name,
        attendance: data.attendance,
        assignedSeats: data.guest_count,
        actualSeats: hasActualGuestCountColumn ? data.actual_guest_count : actualSeats,
        timestamp: data.created_at,
      },
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// WhatsApp notification function (updated)
async function sendWhatsAppNotification({
  guestName,
  attendance,
  assignedSeats,
  actualSeats,
  message,
  hasActualGuestCountColumn,
}: {
  guestName: string
  attendance: string
  assignedSeats: number
  actualSeats: number
  message: string
  hasActualGuestCountColumn: boolean
}) {
  try {
    const attendanceText = attendance === "yes" ? "SI asistira" : "NO asistira"

    let seatInfo = ""
    if (attendance === "yes" && hasActualGuestCountColumn) {
      if (actualSeats === assignedSeats) {
        seatInfo = `ASIENTOS: Usara todos los ${assignedSeats} asientos asignados`
      } else {
        seatInfo = `ASIENTOS: Usara ${actualSeats} de ${assignedSeats} asientos asignados`
      }
    } else if (attendance === "yes") {
      seatInfo = `ASIENTOS: ${assignedSeats} asientos asignados`
    } else {
      seatInfo = `ASIENTOS: Tenia ${assignedSeats} asientos asignados`
    }

    const whatsappMessage =
      `Nueva confirmacion de boda\n\n` +
      `INVITADO: ${guestName}\n` +
      `ASISTENCIA: ${attendanceText}\n` +
      `${seatInfo}\n` +
      `MENSAJE: ${message || "Sin mensaje"}\n\n` +
      `RECIBIDO: ${new Date().toLocaleString("es-ES")}`

    // Send via Twilio WhatsApp
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      await sendViaTwilioWhatsApp(process.env.COUPLE_WHATSAPP_NUMBER!, whatsappMessage)
      console.log("WhatsApp notification sent successfully")
    }
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error)
    throw error
  }
}

// Twilio WhatsApp function
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
    throw new Error(`Twilio WhatsApp error: ${errorText}`)
  }
}

// GET method for testing
export async function GET() {
  console.log("=== API Health Check ===")
  console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing")
  console.log("Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing")
  console.log("Twilio SID:", process.env.TWILIO_ACCOUNT_SID ? "✅ Set" : "❌ Missing")

  return NextResponse.json({
    message: "RSVP API is working",
    timestamp: new Date().toISOString(),
    config: {
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      twilio: !!process.env.TWILIO_ACCOUNT_SID,
    },
    endpoints: {
      POST: "/api/rsvp - Submit RSVP data",
      GET: "/api/rsvp - Check API status",
    },
  })
}
