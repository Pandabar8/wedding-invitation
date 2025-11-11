"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

interface Guest {
  id?: number
  name: string
  phone: string
  seatCount: number
  invitationSent: boolean
}

interface WhatsAppLink {
  guest: string
  phone: string
  cleanPhone: string
  whatsappUrl: string
  message: string
}

export default function BulkSender() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") || "initial"
  const isFollowupMode = mode === "followup"

  const [guests, setGuests] = useState<Guest[]>([])
  const [whatsappLinks, setWhatsappLinks] = useState<WhatsAppLink[]>([])
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoMode, setAutoMode] = useState(false)
  const [sendingStats, setSendingStats] = useState({ sent: 0, total: 0 })

  useEffect(() => {
    loadGuestList()
  }, [])

  const loadGuestList = () => {
    const storageKey = isFollowupMode ? "wedding-followup-guests" : "wedding-guest-list"
    const savedGuests = localStorage.getItem(storageKey)
    if (savedGuests) {
      setGuests(JSON.parse(savedGuests))
    }
  }

  const saveGuestList = (updatedGuests: Guest[]) => {
    localStorage.setItem("wedding-guest-list", JSON.stringify(updatedGuests))
    setGuests(updatedGuests)
  }

  const generateWhatsAppLinks = async () => {
    const targetGuests = isFollowupMode ? guests : guests.filter((g) => !g.invitationSent)

    if (targetGuests.length === 0) {
      alert(isFollowupMode ? "No hay invitados para seguimiento" : "Todas las invitaciones ya han sido enviadas")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/generate-whatsapp-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: targetGuests, mode }),
      })

      const result = await response.json()

      if (result.success) {
        setWhatsappLinks(result.links)
        setCurrentIndex(0)
        setSendingStats({ sent: 0, total: result.links.length })
        alert(`✅ ${result.links.length} enlaces de WhatsApp generados!`)
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("❌ Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const openWhatsAppLink = (index: number) => {
    if (index < whatsappLinks.length) {
      const link = whatsappLinks[index]
      window.open(link.whatsappUrl, "_blank")
      setCurrentIndex(index)
    }
  }

  const markAsSent = (index: number) => {
    const link = whatsappLinks[index]

    const mainGuestList = localStorage.getItem("wedding-guest-list")
    if (mainGuestList) {
      const allGuests = JSON.parse(mainGuestList)
      const updatedGuests = allGuests.map((g: Guest) => (g.name === link.guest ? { ...g, invitationSent: true } : g))
      localStorage.setItem("wedding-guest-list", JSON.stringify(updatedGuests))
    }

    setSendingStats((prev) => ({ ...prev, sent: prev.sent + 1 }))

    // Auto-advance to next
    if (autoMode && index + 1 < whatsappLinks.length) {
      setTimeout(() => {
        setCurrentIndex(index + 1)
        openWhatsAppLink(index + 1)
      }, 2000)
    }
  }

  const startAutoMode = () => {
    if (whatsappLinks.length === 0) {
      alert("Primero genera los enlaces de WhatsApp")
      return
    }

    setAutoMode(true)
    setCurrentIndex(0)
    openWhatsAppLink(0)

    alert(
      "🚀 Modo automático activado!\n\n" +
      "1. Se abrirá WhatsApp con el mensaje pre-escrito\n" +
      "2. Solo presiona ENVIAR en WhatsApp\n" +
      "3. Regresa aquí y presiona 'Enviado'\n" +
      "4. Se abrirá automáticamente el siguiente\n\n" +
      "¡Súper rápido y fácil!",
    )
  }

  const stopAutoMode = () => {
    setAutoMode(false)
  }

  const resetProgress = () => {
    setWhatsappLinks([])
    setCurrentIndex(0)
    setSendingStats({ sent: 0, total: 0 })
    setAutoMode(false)
  }

  const unsentGuests = isFollowupMode ? guests : guests.filter((g) => !g.invitationSent)
  const progress = whatsappLinks.length > 0 ? (sendingStats.sent / sendingStats.total) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isFollowupMode ? "Envío de Recordatorios RSVP" : "Envío Masivo de Invitaciones"}
          </h1>
          <p className="text-gray-600">
            {isFollowupMode
              ? "Envía recordatorios a invitados que no han confirmado su asistencia"
              : "Sistema automatizado para enviar invitaciones vía WhatsApp"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">
              {isFollowupMode ? "Para Seguimiento" : "Total Invitados"}
            </h3>
            <p className="text-3xl font-bold text-blue-600">{guests.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">Pendientes</h3>
            <p className="text-3xl font-bold text-orange-600">{unsentGuests.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">Enviadas</h3>
            <p className="text-3xl font-bold text-green-600">
              {isFollowupMode ? 0 : guests.filter((g) => g.invitationSent).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600">Progreso</h3>
            <p className="text-3xl font-bold text-purple-600">{Math.round(progress)}%</p>
          </div>
        </div>

        {isFollowupMode && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
            <p className="text-orange-800 font-semibold">
              📨 Modo Recordatorio: Enviando mensajes de seguimiento a invitados sin respuesta
            </p>
          </div>
        )}

        {/* How it Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-4">Cómo Funciona (Súper Fácil)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
            <div className="flex items-start gap-3">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <div>
                <p className="font-semibold">Generar Enlaces</p>
                <p>Crea enlaces de WhatsApp con mensajes personalizados</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <div>
                <p className="font-semibold">Modo Automático</p>
                <p>Se abren automáticamente uno por uno</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <div>
                <p className="font-semibold">Solo Presiona Enviar</p>
                <p>El mensaje ya está escrito, solo envía</p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Panel de Control</h2>

          {whatsappLinks.length === 0 ? (
            <div className="text-center">
              <button
                onClick={generateWhatsAppLinks}
                disabled={loading || unsentGuests.length === 0}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-lg font-semibold"
              >
                {loading
                  ? "Generando..."
                  : `Generar ${unsentGuests.length} Enlaces de ${isFollowupMode ? "Recordatorio" : "WhatsApp"}`}
              </button>
              {unsentGuests.length === 0 && (
                <p className="text-gray-500 mt-2">
                  {isFollowupMode ? "No hay invitados para seguimiento" : "Todas las invitaciones ya han sido enviadas"}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-gray-600">
                {sendingStats.sent} de {sendingStats.total} {isFollowupMode ? "recordatorios" : "invitaciones"} enviadas
                ({Math.round(progress)}%)
              </p>

              {/* Auto Mode Controls */}
              <div className="flex justify-center gap-4">
                {!autoMode ? (
                  <button
                    onClick={startAutoMode}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Iniciar Modo Automático
                  </button>
                ) : (
                  <button
                    onClick={stopAutoMode}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold"
                  >
                    Detener Modo Automático
                  </button>
                )}
                <button
                  onClick={resetProgress}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Reiniciar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current Invitation */}
        {whatsappLinks.length > 0 && currentIndex < whatsappLinks.length && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {isFollowupMode ? "Recordatorio" : "Invitación"} Actual ({currentIndex + 1} de {whatsappLinks.length})
            </h2>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-lg text-gray-800">{whatsappLinks[currentIndex].guest}</h3>
              <p className="text-gray-600">{whatsappLinks[currentIndex].phone}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => openWhatsAppLink(currentIndex)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
              >
                Abrir WhatsApp
              </button>
              <button
                onClick={() => markAsSent(currentIndex)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Marcar como Enviado
              </button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setCurrentIndex(Math.min(whatsappLinks.length - 1, currentIndex + 1))}
                disabled={currentIndex === whatsappLinks.length - 1}
                className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* Invitation List */}
        {whatsappLinks.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Lista de {isFollowupMode ? "Recordatorios" : "Invitaciones"}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invitado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {whatsappLinks.map((link, index) => {
                    const guest = guests.find((g) => g.name === link.guest)
                    const isSent = sendingStats.sent > index
                    const isCurrent = index === currentIndex

                    return (
                      <tr key={index} className={isCurrent ? "bg-blue-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {isCurrent && <span className="text-blue-600 font-bold">→ </span>}
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{link.guest}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{link.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isSent ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {isSent ? "Enviada" : "Pendiente"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openWhatsAppLink(index)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Abrir
                            </button>
                            {!isSent && (
                              <button
                                onClick={() => markAsSent(index)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                Enviado
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
          <h3 className="font-semibold text-yellow-800 mb-2">Consejos para Envío Rápido</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>Usa el modo automático para máxima velocidad</li>
            <li>Mantén WhatsApp Web abierto en otra pestaña</li>
            <li>Puedes enviar ~60 invitaciones por hora fácilmente</li>
            <li>El mensaje ya está pre-escrito, solo presiona "Enviar"</li>
            <li>Si se cierra accidentalmente, continúa desde donde te quedaste</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
