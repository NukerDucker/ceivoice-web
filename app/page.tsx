import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex flex-col items-center justify-center gap-6">
        <Image
          src="/ceivoice-logo.png"
          alt="CEIVoice logo"
          width={120}
          height={120}
          priority
        />
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-700">Under Construction</p>
          <p className="text-sm text-gray-500 mt-4">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
