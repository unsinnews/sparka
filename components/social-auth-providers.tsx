import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { GoogleLogo } from '@phosphor-icons/react';

export function SocialAuthProvidersButtons() {
  return (
    <div>
      <Button
        variant="outline"
        type="button"
        onClick={(e) => signIn('google')}
        className="w-full"
      >
        <GoogleLogo className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
    </div>
  );
}
