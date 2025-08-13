import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Logo } from "@/components/auth/Logo";
import { useAuthStore } from "@/store/useAuthStore";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { requestPasswordReset } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);
    
    try {
      await requestPasswordReset(email);
      setSuccess(true);
      setError("");
      // Stay on the same page but show success message
      // The actual password reset will happen via email link
      setTimeout(() => {
        navigate("/", { 
          replace: true,
          state: { message: "Password reset link has been sent to your email address." }
        });
      }, 2000); // Show success message for 2 seconds before redirecting
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setError(err.response?.data?.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <Logo />
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Forgot Password</h1>
          <p className="text-muted-foreground">
            Back to{" "}
            <Link to="/" className="text-primary underline hover:no-underline">
              Login
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          
          {success && (
            <p className="text-sm text-green-500">
              Password reset link has been sent to your email address. Please check your inbox.
            </p>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
            {isLoading ? "Sending Reset Link..." : "Send Reset Link"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;