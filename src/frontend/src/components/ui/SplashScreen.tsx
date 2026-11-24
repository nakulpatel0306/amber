import { CoffeeBrewLoader } from './CoffeeBrewLoader';

export function SplashScreen({ message }: { message?: string }) {
  return (
    <CoffeeBrewLoader
      variant="fullscreen"
      className="min-h-screen"
      size="md"
      message={message}
      showRotatingMessages={!message}
    />
  );
}
