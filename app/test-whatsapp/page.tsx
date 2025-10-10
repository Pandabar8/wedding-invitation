"use client"

import { useState } from "react"

export default function TestWhatsApp() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [testMessage, setTestMessage] = useState("🧪 Test message from your wedding website!")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [config, setConfig] = useState<any>(null)

  const checkConfig = async () => {
    try {
      const response = await fetch("/api/test-whatsapp")
      const data = await response.json()
      setConfig(data)
    } catch (error) {
      console.error("Error checking config:", error)
    }
  }

  const sendTestMessage = async () => {
    if (!phoneNumber) {
      alert("Please enter a phone number")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, testMessage }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        alert("✅ Test message sent successfully!")
      } else {
        alert(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error:", error)
      setResult({ error: "Network error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">WhatsApp Test Page</h1>

        {/* Configuration Check */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Check Configuration</h2>
          <button onClick={checkConfig} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Check Environment Variables
          </button>

          {config && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Configuration Status:</h3>
              <ul className="space-y-1 text-sm">
                <li>Twilio Account SID: {config.config.twilioSid}</li>
                <li>Twilio Auth Token: {config.config.twilioToken}</li>
                <li>Twilio WhatsApp Number: {config.config.twilioWhatsApp}</li>
                <li>Couple Phone: {config.config.couplePhone}</li>
                <li>Site URL: {config.config.siteUrl}</li>
              </ul>
            </div>
          )}
        </div>

        {/* Test Message */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Send Test Message</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (with country code)</label>
              <input
                type="text"
                placeholder="+50377428772"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Test Message</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={sendTestMessage}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Test Message"}
            </button>
          </div>

          {result && (
            <div className={`mt-4 p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <h3 className="font-semibold mb-2">{result.success ? "✅ Success" : "❌ Error"}</h3>
              <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-yellow-800 mb-2">📋 Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
            <li>
              Make sure your <code>.env.local</code> file exists in the project root
            </li>
            <li>Verify all Twilio credentials are correct</li>
            <li>Check that your Twilio WhatsApp sandbox is active</li>
            <li>Ensure you've joined the WhatsApp sandbox by texting the join code</li>
            <li>Restart your development server after changing environment variables</li>
            <li>Test with your own verified phone number first</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
