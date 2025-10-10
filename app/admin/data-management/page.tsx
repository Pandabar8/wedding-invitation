"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DataManagement() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>("")
  const [confirmText, setConfirmText] = useState("")

  const executeSQL = async (query: string, description: string, requiresConfirmation = true) => {
    if (requiresConfirmation && confirmText !== "DELETE") {
      alert('Para confirmar, escribe "DELETE" en el campo de confirmación')
      return
    }

    setLoading(true)
    setResult("")

    try {
      const { data, error } = await supabase.rpc("execute_sql", { query })

      if (error) {
        throw error
      }

      setResult(`SUCCESS: ${description} completado exitosamente`)
      setConfirmText("")
    } catch (error) {
      console.error("Error:", error)
      setResult(`ERROR: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const cleanAllData = () => {
    const query = `
      DELETE FROM rsvps;
      ALTER SEQUENCE rsvps_id_seq RESTART WITH 1;
    `
    executeSQL(query, "Limpieza completa de datos")
  }

  const cleanTestData = () => {
    const query = `
      DELETE FROM rsvps 
      WHERE guest_name ILIKE '%test%' 
         OR guest_name ILIKE '%prueba%' 
         OR guest_name ILIKE '%demo%'
         OR created_at >= CURRENT_DATE;
    `
    executeSQL(query, "Limpieza de datos de prueba", false)
  }

  const cleanTodayData = () => {
    const query = `
      DELETE FROM rsvps 
      WHERE created_at >= CURRENT_DATE;
    `
    executeSQL(query, "Limpieza de datos de hoy", false)
  }

  const createBackup = () => {
    const query = `
      DROP TABLE IF EXISTS rsvps_backup;
      CREATE TABLE rsvps_backup AS SELECT * FROM rsvps;
    `
    executeSQL(query, "Creación de respaldo", false)
  }

  const restoreBackup = () => {
    const query = `
      DELETE FROM rsvps;
      INSERT INTO rsvps SELECT * FROM rsvps_backup;
    `
    executeSQL(query, "Restauración desde respaldo")
  }

  const getStats = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("rsvps")
        .select("id, guest_name, attendance, created_at")
        .order("created_at", { ascending: false })

      if (error) throw error

      const stats = {
        total: data.length,
        attending: data.filter((r) => r.attendance === "yes").length,
        notAttending: data.filter((r) => r.attendance === "no").length,
        today: data.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString()).length,
      }

      setResult(`📊 Estadísticas actuales:
• Total RSVPs: ${stats.total}
• Asistirán: ${stats.attending}
• No asistirán: ${stats.notAttending}
• RSVPs de hoy: ${stats.today}

Últimos 5 RSVPs:
${data
  .slice(0, 5)
  .map((r) => `• ${r.guest_name} (${r.attendance}) - ${new Date(r.created_at).toLocaleString()}`)
  .join("\n")}`)
    } catch (error) {
      setResult(`ERROR: Error obteniendo estadísticas: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Datos</h1>
          <p className="text-gray-600">Herramientas para limpiar y gestionar los datos de RSVPs</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">PRECAUCIÓN</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>• Estas operaciones son IRREVERSIBLES</p>
                <p>• Siempre crea un respaldo antes de limpiar datos</p>
                <p>• Usa en ambiente de pruebas primero</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Estadísticas Actuales</h2>
          <button
            onClick={getStats}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Cargando..." : "Obtener Estadísticas"}
          </button>
        </div>

        {/* Backup Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Respaldos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={createBackup}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Crear Respaldo
            </button>
            <button
              onClick={restoreBackup}
              disabled={loading}
              className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Restaurar Respaldo
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">El respaldo se guarda en una tabla separada (rsvps_backup)</p>
        </div>

        {/* Cleaning Options */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Opciones de Limpieza</h2>

          <div className="space-y-4">
            {/* Safe cleaning options */}
            <div className="border-l-4 border-green-400 pl-4">
              <h3 className="font-semibold text-green-800 mb-2">Limpieza Segura</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={cleanTestData}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Limpiar Datos de Prueba
                </button>
                <button
                  onClick={cleanTodayData}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Limpiar RSVPs de Hoy
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Elimina solo datos que contengan "test", "prueba", "demo" o sean de hoy
              </p>
            </div>

            {/* Dangerous cleaning option */}
            <div className="border-l-4 border-red-400 pl-4">
              <h3 className="font-semibold text-red-800 mb-2">Limpieza Completa (PELIGROSO)</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para confirmar, escribe "DELETE":
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="DELETE"
                />
              </div>
              <button
                onClick={cleanAllData}
                disabled={loading || confirmText !== "DELETE"}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                ELIMINAR TODOS LOS DATOS
              </button>
              <p className="text-sm text-red-600 mt-2">⚠️ Esto eliminará TODOS los RSVPs permanentemente</p>
            </div>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resultado</h2>
            <pre className="bg-gray-50 p-4 rounded-md text-sm whitespace-pre-wrap overflow-auto">{result}</pre>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
          <h3 className="font-semibold text-blue-800 mb-2">Acciones Rápidas para Producción</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Crear respaldo de datos actuales</li>
            <li>Limpiar datos de prueba</li>
            <li>Verificar estadísticas</li>
            <li>¡Listo para invitados reales!</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
