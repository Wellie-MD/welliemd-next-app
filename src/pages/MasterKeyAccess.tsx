"use client"

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientApi } from '@/api/clientApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Copy, Check, AlertTriangle, Clock } from 'lucide-react';

interface Credentials {
  email: string;
  password: string;
  consumed_at: string;
  requested_by: string | null;
}

type PageState = 'loading' | 'valid' | 'expired' | 'used' | 'error';

export default function MasterKeyAccess() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('loading');
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token || hasFetched.current) return;

    hasFetched.current = true;

    const fetchCredentials = async () => {
      try {
        const data = await clientApi.accessMasterKey(token);
        setCredentials(data);
        setState('valid');
      } catch (err: any) {
        if (err.response?.status === 410) {
          if (err.response?.data?.error?.includes('expired')) {
            setState('expired');
          } else {
            setState('used');
          }
        } else {
          setState('error');
          setError(err.response?.data?.error || 'Failed to access credentials.');
        }
      }
    };

    fetchCredentials();
  }, [token]);

  useEffect(() => {
    if (state !== 'valid') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard/clients');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, navigate]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setError('Failed to copy to clipboard.');
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access link...</p>
        </div>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Link Expired
            </CardTitle>
            <CardDescription>
              This one-time access link has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The access link is valid for 5 minutes and has now expired.
              Please request a new link from the admin portal.
            </p>
            <Button onClick={() => navigate('/dashboard/clients')} className="w-full">
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'used') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Link Already Used
            </CardTitle>
            <CardDescription>
              This one-time access link has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This access link can only be used once and has already been consumed.
              Please request a new link from the admin portal.
            </p>
            <Button onClick={() => navigate('/dashboard/clients')} className="w-full">
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Access Failed
            </CardTitle>
            <CardDescription>
              Unable to access master key credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/dashboard/clients')} className="w-full">
              Go to Admin Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Master Key Credentials</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Self-destructing in {countdown} seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800">
              These credentials will be hidden in {countdown} seconds. Copy them now as the link can only be used once.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                value={credentials?.email || ''}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials?.email || '', 'email')}
              >
                {copiedField === 'email' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials?.password || ''}
                  readOnly
                  className="font-mono pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(credentials?.password || '', 'password')}
              >
                {copiedField === 'password' ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            Requested by: {credentials?.requested_by || 'Unknown'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
