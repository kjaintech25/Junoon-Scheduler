import { redirect } from 'next/navigation'

export default function StreamRedirect() {
  redirect('/admin?tab=stream')
}
