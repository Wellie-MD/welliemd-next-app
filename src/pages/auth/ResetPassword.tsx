import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormData,
  validatePasswordField,
  validateConfirmPassword,
  getPasswordStrength,
} from "@/features/auth/utils/validation";
import { getErrorMessage } from "@/features/auth/utils/errors";

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  const { resetPassword, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: 'onChange',
    defaultValues: {
      token: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');

  // Set token from URL params
  useEffect(() => {
    if (token && uid) {
      setValue('token', `${uid}:${token}`); // Combine uid and token as expected by API
    } else if (token) {
      setValue('token', token);
    }
  }, [token, uid, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setSubmitError(null);
    clearError();

    try {
      await resetPassword(data);
      setIsSuccess(true);
      
      // Redirect to login after success
      setTimeout(() => {
        navigate('/auth/signin', {
          replace: true,
          state: {
            message: 'Password has been reset successfully. Please sign in with your new password.',
          },
        });
      }, 3000);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setSubmitError(errorMessage);
    }
  };

  // Real-time validation feedback
  const passwordValidation = watchedPassword ? validatePasswordField(watchedPassword, false) : null;
  const confirmPasswordValidation = (watchedPassword && watchedConfirmPassword) ? 
    validateConfirmPassword(watchedPassword, watchedConfirmPassword) : null;
  const passwordStrength = watchedPassword ? getPasswordStrength(watchedPassword) : null;

  // If no token, show error state
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
              <p className="text-muted-foreground">
                This password reset link is invalid or has expired.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Link to="/auth/forgot-password">
                <Button className="w-full">
                  Request new reset link
                </Button>
              </Link>

              <Link to="/auth/signin">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Password reset successful</h1>
              <p className="text-muted-foreground">
                Your password has been reset successfully. You will be redirected to the sign in page shortly.
              </p>
            </div>

            <div className="pt-4">
              <Link to="/auth/signin">
                <Button className="w-full">
                  Continue to sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground">
            Enter your new password below.
          </p>
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
          <input type="hidden" {...register('token')} />

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
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

            {/* Password strength indicator */}
            {passwordStrength && watchedPassword && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength.score < 2
                          ? 'bg-destructive'
                          : passwordStrength.score < 4
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {passwordStrength.score < 2 ? 'Weak' : passwordStrength.score < 4 ? 'Good' : 'Strong'}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {passwordStrength.feedback.map((feedback, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="text-destructive">•</span>
                        {feedback}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            {passwordValidation && !passwordValidation.isValid && !errors.password && (
              <p className="text-sm text-destructive">{passwordValidation.error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                {...register('confirmPassword')}
                className={errors.confirmPassword || (confirmPasswordValidation && !confirmPasswordValidation.isValid) ? 'border-destructive' : ''}
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
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
            {confirmPasswordValidation && !confirmPasswordValidation.isValid && !errors.confirmPassword && (
              <p className="text-sm text-destructive">{confirmPasswordValidation.error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isValid}
          >
            {isLoading ? "Resetting password..." : "Reset password"}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/auth/signin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;