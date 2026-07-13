import { useState } from 'react';

interface ProviderIconProps {
  logoUrl?: string;
  fallback: string;
  size: number;
  radius: number;
  fontSize?: number;
  background?: string;
  border?: string;
}

export default function ProviderIcon({
  logoUrl,
  fallback,
  size,
  radius,
  fontSize,
  background = 'var(--km-s2)',
  border = '1px solid var(--km-b)',
}: ProviderIconProps) {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(logoUrl) && !errored;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background,
        border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize ?? size * 0.5,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: size * 0.14 }}
          onError={() => setErrored(true)}
        />
      ) : (
        fallback
      )}
    </div>
  );
}
