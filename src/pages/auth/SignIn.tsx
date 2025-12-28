import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Logo } from "@/components/auth/Logo";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { useToast } from "@/components/ui/useToast";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { showToast, ToastComponent } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await authService.login({ email, password });
      navigate("/");  // Navigate to dashboard on successful login
    } catch (err) {
      console.error('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.');
      const message =
      err?.response?.data?.message ||
      "Failed to sign in. Please check your credentials.";

    showToast(message);

    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <Logo />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign in</h1>
          {/* <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary underline hover:no-underline">
              Create now
            </Link>
          </p> */}
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

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="@#*%"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground">
                Remember me
              </Label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-primary underline hover:no-underline"
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>

          {/* {error && <p className="text-red-500 text-sm">{error}</p>} */}
           {ToastComponent}
        </form>

        {/* <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">OR</span>
          </div>
        </div> */}

        {/* <SocialButtons /> */}
      </div>
    </AuthLayout>
  );
};

export default SignIn;
