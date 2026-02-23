import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left Side: Decorative Panel */}
      <div className="relative hidden w-full flex-1 items-center justify-center bg-orange-500 lg:flex">
        {/* Replace with your specific circuit image/SVG */}
        <div
          className="absolute inset-0 z-0 opacity-40"
          style={{ backgroundImage: 'url("/auth-bg.jpg")', backgroundSize: 'cover' }}
        />
        <div className="z-10 text-white p-12">
          {/* Optional overlay text from design */}
        </div>
      </div>

      {/* Right Side: Auth Forms */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 lg:px-12">
        <div className="w-full max-w-[400px] space-y-6">
          <div className="flex flex-col items-center gap-2">
            <Image
              src="/ceivoice-logo.png"
              alt="CEIVoice"
              width={300}
              height={300}
              // className="h-10 w-10"
            />
          </div>
          {children}
          <p className="text-center text-xs text-gray-500">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline">Terms of Service</a> and{" "}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}