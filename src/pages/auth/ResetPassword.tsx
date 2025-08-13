import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Logo } from "@/components/auth/Logo";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/ui/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(""); // Add local error state
  
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmPasswordReset, isLoading } = useAuthStore();
  const { toast } = useToast();

  // Get uid and token from URL query parameters
  const params = new URLSearchParams(location.search);
  const uid = params.get('uid');
  const token = params.get('token');

  // If uid or token is missing, redirect back to login
  useEffect(() => {
    if (!uid || !token) {
      toast({
        title: "Invalid Reset Link",
        description: "The password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [uid, token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!uid || !token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    try {
      await confirmPasswordReset(uid, token, password);
      // On successful password reset, redirect to login with success message
      navigate("/", { 
        replace: true,
        state: { message: "Password has been reset successfully. Please login with your new password." }
      });
    } catch (err: any) {
      // Handle specific error cases from the API
      const errorData = err.response?.data;
      if (errorData) {
        if (errorData.uid) {
          setError("Invalid reset link or user does not exist.");
        } else if (errorData.token) {
          setError("Reset link has expired. Please request a new one.");
        } else if (errorData.new_password) {
          setError(Array.isArray(errorData.new_password) 
            ? errorData.new_password.join(" ") 
            : "Invalid password. Please try a different one.");
        } else {
          setError("Failed to reset password. Please try again.");
        }
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  if (!uid || !token) return null; // Don't render if uid or token is missing and redirecting

  return (
    <AuthLayout>
      <div className="space-y-6">
        <Logo />
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reset Password</h1>
          <p className="text-muted-foreground">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {error && ( // Display local error message
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-base"
            disabled={isLoading}
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;