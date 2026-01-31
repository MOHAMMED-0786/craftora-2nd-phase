import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/hooks/useAuth';

export default function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, isLoading, navigate]);

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
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <Logo size="lg" />
          </div>

          {/* Tagline */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              Made by Hands.
              <br />
              <span className="text-primary">Made with Heart.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
              Discover authentic homemade food and handcrafted treasures from local artisans in your community
            </p>
          </div>

          {/* Illustration */}
          <div className="my-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="bg-secondary/30 rounded-3xl p-12 shadow-warm">
              <div className="grid grid-cols-3 gap-8 text-6xl">
                <div className="transform hover:scale-110 transition-transform">🍪</div>
                <div className="transform hover:scale-110 transition-transform">🧵</div>
                <div className="transform hover:scale-110 transition-transform">🎨</div>
                <div className="transform hover:scale-110 transition-transform">🥐</div>
                <div className="transform hover:scale-110 transition-transform">💍</div>
                <div className="transform hover:scale-110 transition-transform">🏺</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/onboarding')}
              className="w-full md:w-auto min-w-[280px]"
            >
              Get Started
            </Button>
            <p className="text-sm text-muted-foreground">
              Join our community of makers and buyers
            </p>
          </div>
        </div>
      </div>

      {/* Features Footer */}
      <div className="border-t border-border bg-card/50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl">🏠</div>
              <h3 className="font-semibold text-foreground">Local & Trusted</h3>
              <p className="text-sm text-muted-foreground">Connect with verified artisans in your neighborhood</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">✋</div>
              <h3 className="font-semibold text-foreground">100% Handmade</h3>
              <p className="text-sm text-muted-foreground">Every item crafted with care and authenticity</p>
            </div>
            <div className="space-y-2">
              <div className="text-3xl">❤️</div>
              <h3 className="font-semibold text-foreground">Community First</h3>
              <p className="text-sm text-muted-foreground">Supporting local businesses and families</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
