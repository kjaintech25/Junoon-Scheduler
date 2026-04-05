import { redirect } from 'next/navigation'

export default function SlotsRedirect() {
  redirect('/admin?tab=slots')
}
