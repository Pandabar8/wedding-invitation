import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        console.log("=== DATABASE TEST ===")
        console.log("Supabase URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
        console.log("Supabase Key:", supabaseKey ? "✅ Set" : "❌ Missing")

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json(
                {
                    error: "Environment variables missing",
                    hasUrl: !!supabaseUrl,
                    hasKey: !!supabaseKey,
                },
                { status: 500 },
            )
        }

        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Test 1: Check if we can connect
        console.log("Testing connection...")
        const { data: tables, error: tablesError } = await supabase.from("rsvps").select("*").limit(1)

        if (tablesError) {
            console.error("Connection error:", tablesError)
            return NextResponse.json(
                {
                    error: "Database connection failed",
                    details: tablesError.message,
                    code: tablesError.code,
                    hint: tablesError.hint,
                },
                { status: 500 },
            )
        }

        console.log("✅ Connection successful!")

        // Test 2: Try to insert a test record
        console.log("Testing insert...")
        const testData = {
            guest_name: "TEST - Database Check",
            attendance: "yes" as const,
            guest_count: 1,
            message: "This is a test entry - safe to delete",
            ip_address: "test",
            user_agent: "test",
        }

        const { data: insertData, error: insertError } = await supabase.from("rsvps").insert([testData]).select().single()

        if (insertError) {
            console.error("Insert error:", insertError)
            return NextResponse.json(
                {
                    error: "Database insert failed",
                    details: insertError.message,
                    code: insertError.code,
                    hint: insertError.hint,
                    testData: testData,
                },
                { status: 500 },
            )
        }

        console.log("✅ Insert successful!", insertData)

        // Clean up test record
        if (insertData?.id) {
            await supabase.from("rsvps").delete().eq("id", insertData.id)
            console.log("✅ Test record cleaned up")
        }

        return NextResponse.json({
            success: true,
            message: "Database is working correctly!",
            connection: "✅ Connected",
            insert: "✅ Can insert records",
            cleanup: "✅ Can delete records",
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error("Unexpected error:", error)
        return NextResponse.json(
            {
                error: "Unexpected error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        )
    }
}
