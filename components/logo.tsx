import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.svg"
        alt="Legal Rag AI"
        width={size}
        height={size}
        className="flex-shrink-0"
      />
      <span className="font-bold text-xl text-gray-800 dark:text-white">
        Legal RAG IA
      </span>
    </div>
  );
} 