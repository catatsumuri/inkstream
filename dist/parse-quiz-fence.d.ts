export interface QuizOption {
    label: string;
    text: string;
}
export interface QuizContent {
    question: string;
    correct: string;
    options: QuizOption[];
    hint?: string;
    incorrect?: string;
    correctMessage?: string;
    explanation?: string;
}
/**
 * Parses a `question:` / `A: ...` / `correct:` style quiz fence into
 * structured content, or null if it's malformed (missing question/correct,
 * fewer than two options, or `correct` not naming a real option). Ported
 * from inkstream v1's `parseQuizContent`.
 */
export declare function parseQuizFence(content: string): QuizContent | null;
//# sourceMappingURL=parse-quiz-fence.d.ts.map