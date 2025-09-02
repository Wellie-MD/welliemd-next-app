import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/features/auth";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormData,
  validateEmailField,
} from "@/features/auth/utils/validation";
import { getErrorMessage } from "@/features/auth/utils/errors";

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { forgotPassword, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordFormSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const watchedEmail = watch('email');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setSubmitError(null);
    clearError();

    try {
      await forgotPassword(data);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setSubmitError(errorMessage);
    }
  };

  const handleTryAgain = () => {
    setIsSubmitted(false);
    setSubmittedEmail("");
    setSubmitError(null);
    clearError();
    reset();
  };

  // Real-time validation feedback
  const emailValidation = watchedEmail ? validateEmailField(watchedEmail) : null;

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
              <p className="text-muted-foreground">
                We've sent a password reset link to
              </p>
              <p className="font-medium">{submittedEmail}</p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>Didn't receive the email?</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure the email address is correct</li>
                  <li>• Wait a few minutes for the email to arrive</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleTryAgain}
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Try a different email
                </Button>

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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
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
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              {...register('email')}
              className={errors.email || (emailValidation && !emailValidation.isValid) ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
            {emailValidation && !emailValidation.isValid && !errors.email && (
              <p className="text-sm text-destructive">{emailValidation.error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !isValid}
          >
            {isLoading ? "Sending reset link..." : "Send reset link"}
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

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link to="/auth/signin" className="text-primary underline hover:no-underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;