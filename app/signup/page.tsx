import SignupForm from '@/components/signup-form'
import { BrandMark } from '@/components/brand-mark'

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <div className="mx-auto">
          <BrandMark />
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
