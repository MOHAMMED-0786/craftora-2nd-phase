import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/hooks/useAuth';
import { blink } from '@/lib/blink';
import { UserRole } from '@/types';

export default function Auth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const selectedRole = (localStorage.getItem('selectedRole') as UserRole) || 'buyer';

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      handleProfileCheck();
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const handleProfileCheck = async () => {
    if (!user) return;

    // If profile already exists, go home
    if (user.profile) {
      navigate('/home');
      return;
    }

    // Otherwise, create profile
    try {
      await blink.db.users.create({
        user_id: user.id,
        email: user.email,
        display_name: user.displayName || user.email.split('@')[0],
        role: selectedRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // If seller, also create seller entry
      if (selectedRole === 'seller') {
        await blink.db.sellers.create({
          user_id: user.id,
          verification_status: 'pending',
          rating_average: 0,
          total_reviews: 0,
          total_orders: 0,
          total_earnings: 0,
          is_active: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      navigate('/home');
    } catch (error) {
      console.error('Error creating profile:', error);
      // Maybe stay on auth page or show error
    }
  };

  const handleLogin = () => {
    login();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <Button variant="ghost" size="sm" onClick={() => navigate('/onboarding')}>
            Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-card rounded-2xl shadow-warm p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-4">
                <div className="bg-primary/10 text-primary rounded-full p-4">
                  {selectedRole === 'buyer' ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome to Craftora
              </h1>
              <p className="text-muted-foreground">
                Sign in to continue as a{' '}
                <span className="font-medium text-primary">
                  {selectedRole === 'buyer' ? 'Buyer' : 'Seller'}
                </span>
              </p>
            </div>

            {/* Login Button */}
            <div className="space-y-4">
              <Button
                size="lg"
                variant="primary"
                onClick={handleLogin}
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In with Blink Auth
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">
                    Secure authentication
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">What happens next?</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Complete your profile setup</li>
                    {selectedRole === 'seller' && <li>Submit verification documents</li>}
                    <li>Start {selectedRole === 'buyer' ? 'shopping' : 'selling'} on Craftora</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground pt-4">
              By continuing, you agree to Craftora's Terms of Service and Privacy Policy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
