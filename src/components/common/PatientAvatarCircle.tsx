import { useState, useEffect } from 'react';

interface PatientAvatarCircleProps {
  // Callers pass `user?.avatar_url`, which is `string | undefined` (not omitted) - declared
  // without `?:` so exactOptionalPropertyTypes doesn't reject the explicit undefined.
  avatarUrl: string | undefined;
  initials: string;
  size: number;
  fontSize: number;
  background?: string;
}

/**
 * Read-only avatar display: renders the patient's avatar_url image when present and
 * loadable, otherwise falls back to initials. No upload/change UI (see Task 2.4 plan D4).
 */
export function PatientAvatarCircle({
  avatarUrl,
  initials,
  size,
  fontSize,
  background = 'linear-gradient(135deg, #4f8ef7, #a78bfa)',
}: PatientAvatarCircleProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const showImage = Boolean(avatarUrl) && !imgFailed;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {showImage ? (
        <img
          src={avatarUrl as string}
          alt=""
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials
      )}
    </div>
  );
}
