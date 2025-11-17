import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ShortcutKey } from '@/components/ui/shortcut-key';
import { Check, X } from 'lucide-react';

interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  category: string;
}

interface ShortcutTesterProps {
  shortcuts: Shortcut[];
  onComplete: (practiced: string[]) => void;
}

export const ShortcutTester: React.FC<ShortcutTesterProps> = ({
  shortcuts,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiced, setPracticed] = useState<string[]>([]);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const currentShortcut = shortcuts[currentIndex];
  const progress = (practiced.length / shortcuts.length) * 100;

  useEffect(() => {
    if (!currentShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys(prev => new Set([...prev, key]));

      // Check if all keys match
      const requiredKeys = currentShortcut.keys.map(k => k.toLowerCase());
      const allPressed = requiredKeys.every(k => {
        if (k === 'ctrl') return e.ctrlKey;
        if (k === 'shift') return e.shiftKey;
        if (k === 'alt') return e.altKey;
        if (k === 'meta') return e.metaKey;
        return pressedKeys.has(k) || key === k;
      });

      if (allPressed) {
        e.preventDefault();
        setIsCorrect(true);
        setTimeout(() => {
          setPracticed(prev => [...prev, currentShortcut.id]);
          setCurrentIndex(prev => prev + 1);
          setPressedKeys(new Set());
          setIsCorrect(null);
        }, 1000);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentShortcut, pressedKeys]);

  if (currentIndex >= shortcuts.length) {
    return (
      <Card className="p-6 text-center">
        <div className="mb-4">
          <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Practice Complete!</h3>
          <p className="text-muted-foreground">
            You've practiced {practiced.length} shortcuts
          </p>
        </div>
        <Button onClick={() => onComplete(practiced)}>
          Finish
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>Progress</span>
          <span className="text-muted-foreground">
            {practiced.length} / {shortcuts.length}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Challenge */}
      <Card className="p-6">
        <Badge className="mb-4">{currentShortcut.category}</Badge>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {currentShortcut.description}
            </h3>
            <p className="text-muted-foreground text-sm">
              Press the correct keyboard shortcut
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 py-8">
            {currentShortcut.keys.map((key, i) => (
              <React.Fragment key={i}>
                <ShortcutKey className="text-lg px-4 py-3">
                  {key}
                </ShortcutKey>
                {i < currentShortcut.keys.length - 1 && (
                  <span className="text-muted-foreground text-lg">+</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {isCorrect !== null && (
            <div
              className={`text-center py-2 rounded-md ${
                isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
              }`}
            >
              {isCorrect ? (
                <div className="flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">Correct!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <X className="h-4 w-4" />
                  <span className="font-medium">Try again</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setPracticed(prev => [...prev, currentShortcut.id]);
            setCurrentIndex(prev => prev + 1);
          }}
        >
          Skip
        </Button>
      </div>
    </div>
  );
};
