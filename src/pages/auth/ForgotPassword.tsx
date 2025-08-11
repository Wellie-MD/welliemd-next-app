import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Logo } from "@/components/auth/Logo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to reset password page after submitting
    navigate("/reset-password");
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <Logo />
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Forget Password</h1>
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

          <Button type="submit" className="w-full h-12 text-base">
            Submit
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;