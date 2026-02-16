import ChatInterface from '@/components/ChatInterface';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function Home() {
  return (
    <ThemeProvider>
      <ChatInterface />
    </ThemeProvider>
  );
}