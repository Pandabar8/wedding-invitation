import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  console.log("=== WHATSAPP CONFIGURATION TEST ===")

  const config = {
    twilioSid: process.env.TWILIO_ACCOUNT_SID ? "✅ Set" : "❌ Missing",
    twilioToken: process.env.TWILIO_AUTH_TOKEN ? "✅ Set" : "❌ Missing",
    twilioWhatsApp: process.env.TWILIO_WHATSAPP_NUMBER || "❌ Missing",
    couplePhone: process.env.COUPLE_WHATSAPP_NUMBER || "❌ Missing",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "❌ Missing",
  }

  console.log("Twilio Account SID:", config.twilioSid)
  console.log("Twilio Auth Token:", config.twilioToken)
  console.log("Twilio WhatsApp Number:", config.twilioWhatsApp)
  console.log("Couple Phone:", config.couplePhone)
  console.log("Site URL:", config.siteUrl)

  return NextResponse.json({
    message: "WhatsApp Configuration Test",
    config,
    instructions: {
      step1: "Check your .env.local file exists in project root",
      step2: "Verify all environment variables are set",
      step3: "Restart your development server after changes",
      step4: "Check Twilio WhatsApp sandbox is active",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, testMessage } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    console.log("=== TESTING WHATSAPP SEND ===")
    console.log("Phone:", phoneNumber)
    console.log("Message:", testMessage)

    // Check credentials
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return NextResponse.json({ error: "Twilio credentials missing" }, { status: 500 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"

    console.log("Using Twilio SID:", accountSid.substring(0, 10) + "...")
    console.log("From WhatsApp:", fromWhatsApp)
    console.log("To WhatsApp:", `whatsapp:${phoneNumber}`)

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromWhatsApp,
        To: `whatsapp:${phoneNumber}`,
        Body: testMessage || "🧪 Test message from your wedding website!",
      }),
    })

    const responseText = await response.text()
    console.log("Twilio Response Status:", response.status)
    console.log("Twilio Response:", responseText)

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Twilio API Error",
          status: response.status,
          details: responseText,
        },
        { status: 500 },
      )
    }

    const result = JSON.parse(responseText)
    console.log("✅ WhatsApp sent successfully! SID:", result.sid)

    return NextResponse.json({
      success: true,
      message: "WhatsApp test message sent successfully!",
      twilioSid: result.sid,
    })
  } catch (error) {
    console.error("❌ WhatsApp test failed:", error)
    return NextResponse.json(
      {
        error: "Failed to send test message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
