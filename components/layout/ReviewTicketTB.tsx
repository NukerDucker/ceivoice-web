'use client';

// Search box and InputGroup imports removed

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = 'My Dashboard', subtitle }: HeaderProps) {
  return (
    <div className="relative px-6 pt-6">
      <div className="flex items-center w-full gap-6 p-4 bg-white rounded-xl shadow-sm">
        <div>
          <h3 className="text-2xl font-bold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}