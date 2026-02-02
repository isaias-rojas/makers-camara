'use client';

import { Button } from '@/components/ui/button';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function SuggestedQuestions({
  questions,
  onSelect,
  disabled,
}: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x mask-fade-right">
      {questions.map((question, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(question)}
          disabled={disabled}
          className="shrink-0 rounded-full h-8 text-xs snap-start bg-background shadow-none"
        >
          {question}
        </Button>
      ))}
    </div>
  );
}