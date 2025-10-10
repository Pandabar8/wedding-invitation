import type React from "react"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex space-x-8">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/data-management"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Gestión de Datos
              </Link>
              <Link
                href="/admin/bulk-sender"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Envío Masivo
              </Link>
            </div>
            <div className="text-sm text-gray-500">Wedding Admin</div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {children}
    </div>
  )
}
