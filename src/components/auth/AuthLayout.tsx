interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="h-screen flex flex-row items-stretch">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Right side - Fixed background video (shared across all clients) */}
      <div className="hidden md:flex flex-1 items-center justify-center p-0 bg-black">
        <video
          className="w-full h-full object-cover"
          // NOTE: The actual file should be hosted at this path by the static assets pipeline
          // e.g. a processed mp4/webm uploaded to the CDN or public assets directory.
          src="/Telehealth.Simplified.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
      </div>
    </div>
  );
};