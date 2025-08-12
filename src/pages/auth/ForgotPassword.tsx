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
  const [error, setError] = useState(""); // Add local error state
  const navigate = useNavigate();
  const { requestReset, isLoading } = useAuthStore(); // Remove 'error' from destructuring if it's not used for local display

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    
    try {
      await requestReset(email);
      // After successful email verification, navigate to reset password
      navigate("/reset-password", { state: { email } });
    } catch (err: any) {
      setError(err.response?.data?.message || "Email not found or verification failed."); // Display error on page
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

          {error && ( // Display local error message
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Continue"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;