import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/ui/Logo';
import { UserRole } from '@/types';

export default function Onboarding() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      localStorage.setItem('selectedRole', selectedRole);
      navigate('/auth');
    }
  };

  const roles = [
    {
      id: 'buyer' as UserRole,
      title: 'I want to Buy',
      description: 'Browse and purchase handmade products from local artisans',
      icon: '🛍️',
      features: [
        'Discover local products',
        'Order from verified sellers',
        'Track your orders',
        'Leave reviews'
      ]
    },
    {
      id: 'seller' as UserRole,
      title: 'I want to Sell',
      description: 'Showcase and sell your handmade creations to local customers',
      icon: '🏪',
      features: [
        'List your products',
        'Manage your shop',
        'Track earnings',
        'Build your reputation'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            Back
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full space-y-8">
          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              How would you like to use Craftora?
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose your role to get started
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role) => (
              <Card
                key={role.id}
                variant={selectedRole === role.id ? 'bordered' : 'elevated'}
                className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  selectedRole === role.id
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : ''
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="space-y-4">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{role.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-1">
                        {role.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    </div>
                    {selectedRole === role.id && (
                      <div className="text-accent">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Continue Button */}
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              disabled={!selectedRole}
              onClick={handleContinue}
              className="min-w-[280px]"
            >
              Continue {selectedRole && `as ${selectedRole === 'buyer' ? 'Buyer' : 'Seller'}`}
            </Button>
          </div>

          {/* Note for sellers */}
          {selectedRole === 'seller' && (
            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Note:</span> Seller accounts require verification before you can start selling
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
