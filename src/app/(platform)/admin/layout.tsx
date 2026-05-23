import SystemAlertBanner from '@/components/admin/SystemAlertBanner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SystemAlertBanner />
      {children}
    </>
  )
}
