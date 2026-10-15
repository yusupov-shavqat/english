<?php

namespace App\Contracts;

use App\Support\TutorSettings;
use Closure;

interface EnglishTutor
{
    /**
     * Opening line of a new conversation.
     */
    public function start(TutorSettings $settings): string;

    /**
     * Answer the learner and check their utterance for mistakes. The reply is handed to
     * $onReply as soon as it is ready, before the (slower) check finishes.
     *
     * @param  array<int, array{role: 'user'|'assistant', content: string}>  $history  earlier turns, oldest first
     * @param  Closure(string): void  $onReply
     * @return array{
     *     corrected: string|null,
     *     corrections: array<int, array{original: string, corrected: string, explanation: string, type: string}>
     * }
     */
    public function respond(TutorSettings $settings, array $history, string $message, Closure $onReply): array;

    /**
     * Update what the tutor remembers about the learner after a conversation.
     *
     * @param  array<int, array{role: string, content: string, corrections?: array|null}>  $transcript
     * @return array<string, mixed> the new profile
     */
    public function remember(TutorSettings $settings, array $transcript): array;
}
