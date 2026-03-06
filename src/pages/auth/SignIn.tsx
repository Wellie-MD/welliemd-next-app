import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/features/auth";
import { useBranding } from "@/features/branding/hooks/useBranding";
import {
  loginFormSchema,
  type LoginFormData,
  validateEmailField,
  validatePasswordField,
} from "@/features/auth/utils/validation";
import { getErrorMessage } from "@/features/auth/utils/errors";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { login, isLoading, error, clearError } = useAuth();
  const { logos } = useBranding();

  // Fix LocalStack URLs for browser access
  const fixLocalStackUrl = (url?: string): string | undefined => {
    if (!url) return url;
    if (url.includes('localstack')) {
      return url.replace('localstack', 'localhost');
    }
    return url;
  };

  const logoUrl = fixLocalStackUrl(logos?.square || logos?.transparent);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    clearError();

    try {
      await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe || false,
      });
      // Navigation is handled by the useAuth hook
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setSubmitError(errorMessage);
    }
  };

  // Real-time validation feedback
  const emailValidation = watchedEmail ? validateEmailField(watchedEmail) : null;
  const passwordValidation = watchedPassword ? validatePasswordField(watchedPassword, true) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          {logoUrl && (
            <div className="flex justify-center mb-4">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        </div>

        {/* Display errors */}
        {(error || submitError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || submitError}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register('password')}
                className={errors.password || (passwordValidation && !passwordValidation.isValid) ? 'border-destructive' : ''}
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
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                {...register('rememberMe')}
                defaultChecked={false}
              />
              <Label htmlFor="rememberMe" className="text-sm text-muted-foreground">
                Remember me
              </Label>
            </div>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary underline hover:no-underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isValid}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">OR</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <Link to="/support" className="text-primary underline hover:no-underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
