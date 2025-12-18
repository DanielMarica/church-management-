import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Church, Mail, Lock, User, UserPlus, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';

interface RegisterProps {
  onBackToLogin: () => void; // ADD THIS LINE
}

export default function Register({ onBackToLogin }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher' | 'parent'>('teacher');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess(false);

  // Validation
  if (password !== confirmPassword) {
    setError('Passwords do not match');
    setLoading(false);
    return;
  }

  if (password.length < 6) {
    setError('Password must be at least 6 characters');
    setLoading(false);
    return;
  }

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          phone: phone || null,
        }
      }
    });

    if (authError) throw authError;

    // Check if email confirmation is required
    if (authData.user && !authData.session) {
      // Email confirmation required
      setSuccess(true);
      setError('Please check your email to confirm your account before logging in.');
      setTimeout(() => {
        onBackToLogin();
      }, 4000);
      return;
    }

    if (authData.user) {
      // Create profile (only if user is confirmed)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          phone: phone || null,
        });

      if (profileError) throw profileError;

      setSuccess(true);
      setTimeout(() => {
        onBackToLogin();
      }, 2000);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      setError(error.message || 'Failed to register');
    } else {
      setError('Failed to register');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black mb-4">
            <Church className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-muted-foreground">Register for Sunday School ERP</p>
        </div>

        {/* Register Form */}
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Fill in your details to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-900 border-green-200">
                  <AlertDescription>
                    Account created successfully! Redirecting to login...
                  </AlertDescription>
                </Alert>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    placeholder="your.email@church.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value: 'admin' | 'teacher' | 'parent') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={loading || success} className="w-full">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>

              {/* Back to Login */}
              <Button
                type="button"
                variant="ghost"
                onClick={onBackToLogin}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Need help? Contact your church administrator
        </p>
      </div>
    </div>
  );
}