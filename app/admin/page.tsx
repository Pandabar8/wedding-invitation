"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { RSVP } from "@/lib/supabase"

interface Guest {
  id?: number
  name: string
  phone: string
  seatCount: number
  invitationSent: boolean
  rsvpReceived: boolean
}

interface BulkResult {
  sent: Array<{ guest: string; phone: string; status: string; messageId?: string }>
  failed: Array<{ guest: string; phone: string; status: string; error?: string }>
  total: number
  successRate: string
}

export default function AdminDashboard() {
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"rsvps" | "invitations">("invitations")
  const [newGuest, setNewGuest] = useState({ name: "", phone: "", seatCount: 2 })
  const [sendingInvitation, setSendingInvitation] = useState<number | null>(null)
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)
  const [hasActualGuestCountColumn, setHasActualGuestCountColumn] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    attending: 0,
    notAttending: 0,
    totalGuests: 0,
    assignedSeats: 0,
  })

  useEffect(() => {
    fetchRSVPs()
    loadGuestList()
  }, [])

  const fetchRSVPs = async () => {
    try {
      let { data, error } = await supabase.from("rsvps").select("*").order("created_at", { ascending: false })

      if (error && error.message.includes("actual_guest_count")) {
        console.log("actual_guest_count column doesn't exist, fetching without it")
        setHasActualGuestCountColumn(false)
        const result = await supabase
          .from("rsvps")
          .select("id, guest_name, attendance, guest_count, message, created_at, ip_address, user_agent")
          .order("created_at", { ascending: false })
        data = result.data
        error = result.error
      }

      if (error) throw error

      setRsvps(data || [])

      const total = data?.length || 0
      const attending = data?.filter((r) => r.attendance === "yes").length || 0
      const notAttending = data?.filter((r) => r.attendance === "no").length || 0
      const totalGuests =
        data?.reduce((sum, r) => {
          if (r.attendance === "yes") {
            return sum + (hasActualGuestCountColumn ? r.actual_guest_count || r.guest_count : r.guest_count)
          }
          return sum
        }, 0) || 0
      const assignedSeats = data?.reduce((sum, r) => sum + r.guest_count, 0) || 0

      setStats({ total, attending, notAttending, totalGuests, assignedSeats })
    } catch (error) {
      console.error("Error fetching RSVPs:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadGuestList = () => {
    const savedGuests = localStorage.getItem("wedding-guest-list")
    if (savedGuests) {
      setGuests(JSON.parse(savedGuests))
    }
  }

  const saveGuestList = (updatedGuests: Guest[]) => {
    localStorage.setItem("wedding-guest-list", JSON.stringify(updatedGuests))
    setGuests(updatedGuests)
  }

  const addGuest = () => {
    if (!newGuest.name || !newGuest.phone) {
      alert("Por favor completa nombre y teléfono")
      return
    }

    const guest: Guest = {
      id: Date.now(),
      name: newGuest.name,
      phone: newGuest.phone,
      seatCount: newGuest.seatCount,
      invitationSent: false,
      rsvpReceived: false,
    }

    const updatedGuests = [...guests, guest]
    saveGuestList(updatedGuests)
    setNewGuest({ name: "", phone: "", seatCount: 2 })
  }

  const removeGuest = (id: number) => {
    if (confirm("¿Estás seguro de eliminar este invitado?")) {
      const updatedGuests = guests.filter((g) => g.id !== id)
      saveGuestList(updatedGuests)
    }
  }

  const toggleInvitationStatus = (id: number) => {
    const updatedGuests = guests.map((g) => (g.id === id ? { ...g, invitationSent: !g.invitationSent } : g))
    saveGuestList(updatedGuests)
  }

  const markAllAsSent = () => {
    if (confirm("¿Marcar todas las invitaciones como enviadas?")) {
      const updatedGuests = guests.map((g) => ({ ...g, invitationSent: true }))
      saveGuestList(updatedGuests)
      alert("✅ Todas las invitaciones marcadas como enviadas")
    }
  }

  const exportGuestList = () => {
    const dataStr = JSON.stringify(guests, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `wedding-guests-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importGuestListFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedGuests = JSON.parse(e.target?.result as string)
        if (Array.isArray(importedGuests)) {
          if (confirm(`¿Importar ${importedGuests.length} invitados? Esto reemplazará tu lista actual.`)) {
            saveGuestList(importedGuests)
            alert(`✅ ${importedGuests.length} invitados importados exitosamente!`)
          }
        } else {
          alert("❌ Formato de archivo inválido")
        }
      } catch (error) {
        alert("❌ Error al leer el archivo")
      }
    }
    reader.readAsText(file)
  }

  const importGuestList = () => {
    const csvText = prompt(
      "Pega tu lista de invitados en formato CSV:\n\n" +
      "Formato: Nombre,Teléfono,Asientos\n" +
      "Ejemplo:\n" +
      "Juan Pérez,+50377428772,2\n" +
      "María García,+50377428773,4\n" +
      "Carlos López,+50377428774,1",
    )

    if (!csvText) return

    try {
      const lines = csvText.trim().split("\n")
      const newGuests: Guest[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(",")
        if (parts.length < 2) {
          alert(`Error en línea ${i + 1}: "${line}"\nFormato correcto: Nombre,Teléfono,Asientos`)
          return
        }

        const [name, phone, seatCount] = parts
        newGuests.push({
          id: Date.now() + i,
          name: name.trim(),
          phone: phone.trim(),
          seatCount: Number.parseInt(seatCount?.trim()) || 2,
          invitationSent: false,
          rsvpReceived: false,
        })
      }

      const updatedGuests = [...guests, ...newGuests]
      saveGuestList(updatedGuests)
      alert(`✅ ${newGuests.length} invitados agregados exitosamente!`)
    } catch (error) {
      alert("❌ Error al importar lista. Verifica el formato:\nNombre,Teléfono,Asientos")
    }
  }

  const clearAllGuests = () => {
    if (confirm("¿Estás seguro de eliminar TODOS los invitados? Esta acción no se puede deshacer.")) {
      if (confirm("⚠️ CONFIRMACIÓN FINAL: Esto eliminará toda la lista de invitados.")) {
        localStorage.removeItem("wedding-guest-list")
        setGuests([])
        alert("✅ Lista de invitados eliminada")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Wedding Management Dashboard</h1>

        {/* Quick Start Guide */}
        {guests.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Guía de Inicio Rápido</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
              <div className="flex items-start gap-3">
                <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <p className="font-semibold">Agregar Invitados</p>
                  <p>Usa el formulario abajo o importa una lista CSV/JSON</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <p className="font-semibold">Ir a Envío Masivo</p>
                  <p>Ve a la pestaña "🚀 Envío Masivo" en el menú</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <p className="font-semibold">Enviar Invitaciones</p>
                  <p>Usa el modo automático para envío rápido</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("invitations")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "invitations"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                Gestionar Invitados ({guests.length})
              </button>
              <button
                onClick={() => setActiveTab("rsvps")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "rsvps"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                RSVPs Recibidos ({stats.total})
              </button>
            </nav>
          </div>
        </div>

        {activeTab === "invitations" && (
          <>
            {/* Add Guest Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Agregar Invitado Individual</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newGuest.name}
                  onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Teléfono (+50377428772)"
                  value={newGuest.phone}
                  onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Asientos"
                  value={newGuest.seatCount}
                  onChange={(e) => setNewGuest({ ...newGuest, seatCount: Number.parseInt(e.target.value) || 2 })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addGuest}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Acciones Masivas</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={importGuestList}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Importar CSV
                </button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importGuestListFromFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                    Importar JSON
                  </button>
                </div>
                <button
                  onClick={exportGuestList}
                  disabled={guests.length === 0}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Exportar JSON
                </button>
                <button
                  onClick={markAllAsSent}
                  disabled={guests.length === 0}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  Marcar Todas Enviadas
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <button
                  onClick={() => window.open("/admin/bulk-sender", "_blank")}
                  disabled={guests.length === 0}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  🚀 Ir a Envío Masivo
                </button>
                <button
                  onClick={clearAllGuests}
                  disabled={guests.length === 0}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Limpiar Lista
                </button>
              </div>

              {/* CSV Format Help */}
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold text-gray-700 mb-2">Formato CSV:</h3>
                <code className="text-sm text-gray-600 block">
                  Juan Pérez,+50377428772,2
                  <br />
                  María García,+50377428773,4
                  <br />
                  Carlos López,+50377428774,1
                </code>
                <p className="text-xs text-gray-500 mt-2">Formato: Nombre,Teléfono,Asientos</p>
              </div>
            </div>

            {/* Guest List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Lista de Invitados ({guests.length})</h2>
                {guests.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {guests.filter((g) => !g.invitationSent).length} pendientes •{" "}
                    {guests.filter((g) => g.invitationSent).length} enviadas •{" "}
                    {guests.reduce((sum, g) => sum + g.seatCount, 0)} asientos totales
                  </p>
                )}
              </div>

              {guests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-lg mb-2">No hay invitados agregados</p>
                  <p>Agrega invitados usando el formulario de arriba o importa una lista</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teléfono
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asientos
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
                      {guests.map((guest) => (
                        <tr key={guest.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {guest.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guest.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guest.seatCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => toggleInvitationStatus(guest.id!)}
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer transition-colors ${guest.invitationSent
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  }`}
                              >
                                {guest.invitationSent ? "✓ Enviada" : "○ Pendiente"}
                              </button>
                              {rsvps.some((r) => r.guest_name.toLowerCase().includes(guest.name.toLowerCase())) && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  RSVP Recibido
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => removeGuest(guest.id!)}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "rsvps" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-600">Total RSVPs</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-600">Attending</h3>
                <p className="text-3xl font-bold text-green-600">{stats.attending}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-600">Not Attending</h3>
                <p className="text-3xl font-bold text-red-600">{stats.notAttending}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-600">
                  {hasActualGuestCountColumn ? "Actual Guests" : "Total Guests"}
                </h3>
                <p className="text-3xl font-bold text-purple-600">{stats.totalGuests}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-600">Assigned Seats</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.assignedSeats}</p>
                {hasActualGuestCountColumn && <p className="text-sm text-gray-500">vs {stats.totalGuests} actual</p>}
              </div>
            </div>

            {/* RSVPs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">All RSVPs</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guests
                      </th>
                      {hasActualGuestCountColumn && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seat Usage
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rsvps.map((rsvp) => (
                      <tr key={rsvp.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {rsvp.guest_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${rsvp.attendance === "yes" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                          >
                            {rsvp.attendance === "yes" ? "Attending" : "Not Attending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rsvp.guest_count}</td>
                        {hasActualGuestCountColumn && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {rsvp.attendance === "yes" ? (
                              <div>
                                <span className="font-medium">{rsvp.actual_guest_count || rsvp.guest_count}</span>
                                <span className="text-gray-400"> / {rsvp.guest_count}</span>
                                {(rsvp.actual_guest_count || rsvp.guest_count) < rsvp.guest_count && (
                                  <div className="text-xs text-orange-600">
                                    -{rsvp.guest_count - (rsvp.actual_guest_count || rsvp.guest_count)} seats
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{rsvp.message || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {rsvp.created_at ? new Date(rsvp.created_at).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
