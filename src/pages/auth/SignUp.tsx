import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Logo } from "@/components/auth/Logo";
import { SocialButtons } from "@/components/auth/SocialButtons";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore"; // ✅ Import store

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, isLoading, error } = useAuthStore(); // ✅ Store actions/state
  const navigate = useNavigate();

  // Add console.log to debug error state
  console.log("Auth Store Error:", error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    await register({ name, email, password });
    // Check isAuthenticated from the store after registration attempt
    if (useAuthStore.getState().isAuthenticated) {
      navigate("/"); // redirect to sign-in after successful register and login
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <Logo />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign up</h1>
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="text-primary underline hover:no-underline">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Steve Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="@#*%"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
            {isLoading ? "Signing up..." : "Sign up"}
          </Button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">OR</span>
          </div>
        </div>

        <SocialButtons />
      </div>
    </AuthLayout>
  );
};

export default SignUp;
