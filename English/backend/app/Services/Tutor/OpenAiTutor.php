<?php

namespace App\Services\Tutor;

use App\Contracts\EnglishTutor;
use App\Services\OpenAi;
use App\Support\TutorSettings;
use Closure;
use Illuminate\Support\Arr;

class OpenAiTutor implements EnglishTutor
{
    public function __construct(
        private OpenAi $openAi,
        private string $model,
    ) {}

    public function start(TutorSettings $settings): string
    {
        $opening = [
            'role' => 'user',
            'content' => $settings->openingInstruction(),
        ];

        return trim($this->openAi->chatAsync($this->replyPayload($settings, [$opening]))->wait());
    }

    public function respond(TutorSettings $settings, array $history, string $message, Closure $onReply): array
    {
        $conversation = [
            ...array_map(fn ($m) => Arr::only($m, ['role', 'content']), $history),
            ['role' => 'user', 'content' => $message],
        ];

        // Both requests run at once; the reply is usually ready first.
        $reply = $this->openAi->chatAsync($this->replyPayload($settings, $conversation));
        $check = $this->openAi->chatAsync($this->checkPayload($settings, $history, $message));

        $onReply(trim($reply->wait()));

        return $this->parseCheck($check->wait());
    }

    private function replyPayload(TutorSettings $settings, array $messages): array
    {
        return [
            'model' => $this->model,
            'temperature' => 0.8,
            'max_tokens' => 200,
            'messages' => [
                ['role' => 'system', 'content' => $settings->conversationPrompt()],
                ...$messages,
            ],
        ];
    }

    private function checkPayload(TutorSettings $settings, array $history, string $message): array
    {
        $question = collect($history)->last(fn ($m) => $m['role'] === 'assistant')['content'] ?? null;
        $context = $question ? "The tutor asked: \"{$question}\"\n" : '';

        return [
            'model' => $this->model,
            'temperature' => 0.2,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => $settings->checkPrompt()],
                ['role' => 'user', 'content' => "{$context}The learner said: \"{$message}\""],
            ],
        ];
    }

    private function parseCheck(string $content): array
    {
        $data = json_decode($content, true);

        $corrections = collect(is_array($data) ? ($data['corrections'] ?? []) : [])
            ->filter(fn ($c) => is_array($c) && filled($c['original'] ?? null) && filled($c['corrected'] ?? null))
            // Speech has no capitals or punctuation of its own, so differences in those are not real mistakes.
            ->reject(fn ($c) => $this->normalize($c['original']) === $this->normalize($c['corrected']))
            ->map(fn ($c) => [
                'original' => (string) $c['original'],
                'corrected' => (string) $c['corrected'],
                'explanation' => (string) ($c['explanation'] ?? ''),
                'type' => $this->normalizeType($c['type'] ?? null),
            ])
            ->values()
            ->all();

        return [
            'corrected' => $corrections && filled($data['corrected'] ?? null) ? trim($data['corrected']) : null,
            'corrections' => $corrections,
        ];
    }

    /**
     * Update the learner profile from the finished conversation.
     */
    public function remember(TutorSettings $settings, array $transcript): array
    {
        $lines = collect($transcript)->map(function ($m) {
            $who = $m['role'] === 'user' ? 'Learner' : 'English';
            $line = "{$who}: {$m['content']}";
            foreach ($m['corrections'] ?? [] as $c) {
                $line .= "\n  mistake ({$c['type']}): \"{$c['original']}\" -> \"{$c['corrected']}\"";
            }

            return $line;
        })->implode("\n");

        $current = json_encode($settings->profile ?? (object) [], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        $content = $this->openAi->chatAsync([
            'model' => $this->model,
            'temperature' => 0.3,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                ['role' => 'system', 'content' => $settings->memoryPrompt()],
                ['role' => 'user', 'content' => "Learner's name: {$settings->learnerName}\n\nCurrent notes:\n{$current}\n\nConversation:\n{$lines}"],
            ],
        ])->wait();

        $data = json_decode($content, true);
        if (! is_array($data)) {
            return $settings->profile ?? [];
        }

        $list = fn ($v, $max) => array_slice(array_values(array_filter((array) $v, 'is_string')), 0, $max);

        return [
            'about' => (string) ($data['about'] ?? ''),
            'interests' => $list($data['interests'] ?? [], 8),
            'level' => (string) ($data['level'] ?? ''),
            'strengths' => $list($data['strengths'] ?? [], 4),
            'weak_points' => $list($data['weak_points'] ?? [], 5),
            'last_talk' => (string) ($data['last_talk'] ?? ''),
        ];
    }

    /** Models sometimes answer "vocabulary|preposition"; keep the first known type. */
    private function normalizeType(mixed $type): string
    {
        foreach (preg_split('/[\s|,\/]+/', strtolower((string) $type)) as $candidate) {
            if (in_array($candidate, TutorSettings::MISTAKE_TYPES, true)) {
                return $candidate;
            }
        }

        return 'grammar';
    }

    private function normalize(string $text): string
    {
        return trim(preg_replace('/[^\p{L}\p{N}\']+/u', ' ', mb_strtolower($text)));
    }
}
