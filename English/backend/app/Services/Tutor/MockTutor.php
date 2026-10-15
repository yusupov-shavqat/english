<?php

namespace App\Services\Tutor;

use App\Contracts\EnglishTutor;
use App\Support\TutorSettings;
use Closure;

/**
 * Offline stand-in used until a real AI provider is configured.
 * It only catches a handful of common learner mistakes with patterns.
 */
class MockTutor implements EnglishTutor
{
    private const THIRD_PERSON = [
        'go' => 'goes', 'do' => 'does', 'have' => 'has', 'want' => 'wants', 'like' => 'likes',
        'play' => 'plays', 'work' => 'works', 'live' => 'lives', 'watch' => 'watches', 'study' => 'studies',
        'need' => 'needs', 'know' => 'knows', 'love' => 'loves', 'think' => 'thinks',
    ];

    private const IRREGULAR_PAST = [
        'went' => 'go', 'saw' => 'see', 'ate' => 'eat', 'came' => 'come', 'did' => 'do',
        'made' => 'make', 'took' => 'take', 'bought' => 'buy', 'wrote' => 'write', 'got' => 'get',
    ];

    private const UNCOUNTABLE = [
        'informations' => 'information', 'advices' => 'advice', 'furnitures' => 'furniture',
        'homeworks' => 'homework', 'knowledges' => 'knowledge', 'peoples' => 'people',
    ];

    private const QUESTIONS = [
        'What do you usually do on weekends?',
        'What kind of food do you enjoy the most?',
        'If you could travel anywhere, where would you go and why?',
        'What was the last film or series you really liked?',
        'How do you usually spend your evenings?',
        'What is something new you learned recently?',
        'Do you prefer the city or the countryside? Why?',
        'What would your perfect day look like?',
    ];

    public function start(TutorSettings $settings): string
    {
        $opening = $settings->topic
            ? "Hi there! I'm English, really nice to meet you. I'd love to chat about {$settings->topic}. What's your name?"
            : "Hi {$settings->learnerName}! I'm English, so nice to meet you. ".self::QUESTIONS[array_rand(self::QUESTIONS)];

        return $opening;
    }

    public function respond(TutorSettings $settings, array $history, string $message, Closure $onReply): array
    {
        [$corrected, $corrections] = $this->check($message, $settings->explanationLanguage);

        $turn = count(array_filter($history, fn ($m) => $m['role'] === 'user'));
        $reply = ($settings->topic ? 'Interesting! ' : 'That sounds nice. ')
            .self::QUESTIONS[$turn % count(self::QUESTIONS)];

        $onReply($reply);

        return [
            'corrected' => $corrections ? $corrected : null,
            'corrections' => $corrections,
        ];
    }

    public function remember(TutorSettings $settings, array $transcript): array
    {
        $types = collect($transcript)->pluck('corrections')->flatten(1)->filter()->countBy('type')->sortDesc()->keys();

        return [
            ...($settings->profile ?? []),
            'weak_points' => $types->take(5)->values()->all(),
            'last_talk' => 'We had a short chat.',
        ];
    }

    /**
     * @return array{0: string, 1: array<int, array<string, string>>}
     */
    private function check(string $text, string $lang): array
    {
        $corrections = [];

        $rules = [
            [
                '/\b(I|i) am agree\b/',
                fn () => 'I agree',
                'grammar',
                "\"Agree\" fe'l, u \"am\" bilan ishlatilmaydi.",
                '"Agree" is a verb, so it does not need "am".',
            ],
            [
                '/\b(he|she|it)\s+('.implode('|', array_keys(self::THIRD_PERSON)).')\b/i',
                fn ($m) => $m[1].' '.self::THIRD_PERSON[strtolower($m[2])],
                'grammar',
                "He/she/it bilan Present Simple'da fe'lga -s/-es qo'shiladi.",
                'With he/she/it, Present Simple verbs take -s/-es.',
            ],
            [
                '/\b(didn\'t|did not)\s+('.implode('|', array_keys(self::IRREGULAR_PAST)).')\b/i',
                fn ($m) => $m[1].' '.self::IRREGULAR_PAST[strtolower($m[2])],
                'grammar',
                "\"Did\"dan keyin fe'l birinchi shaklda bo'ladi.",
                'After "did", use the base form of the verb.',
            ],
            [
                '/\b(can|must|should|will)\s+to\s+(\w+)/i',
                fn ($m) => $m[1].' '.$m[2],
                'grammar',
                'Modal fe\'llardan keyin "to" ishlatilmaydi.',
                'Modal verbs are not followed by "to".',
            ],
            [
                '/\bmore (better|worse|bigger|smaller|easier|harder)\b/i',
                fn ($m) => $m[1],
                'grammar',
                "Bu so'z allaqachon qiyosiy darajada, \"more\" kerak emas.",
                'This word is already comparative, so "more" is not needed.',
            ],
            [
                '/\b(have|has)\s+(\d+)\s+years\s+old\b/i',
                fn ($m) => (strtolower($m[1]) === 'has' ? 'is' : 'am').' '.$m[2].' years old',
                'grammar',
                'Yoshni aytishda "have" emas, "to be" ishlatiladi.',
                'Use "to be", not "have", to say your age.',
            ],
            [
                '/\b(?:an?\s+)?('.implode('|', array_keys(self::UNCOUNTABLE)).')\b/i',
                fn ($m) => self::UNCOUNTABLE[strtolower($m[1])],
                'vocabulary',
                "Bu so'z sanalmaydi yoki o'zi ko'plikda: -s va a/an qo'shilmaydi.",
                'This noun is uncountable or already plural, so it takes no -s and no a/an.',
            ],
            [
                '/\b(a)\s+(?!uni|use|one|eu)([aeiou]\w*)/i',
                fn ($m) => ($m[1] === 'A' ? 'An' : 'an').' '.$m[2],
                'grammar',
                'Unli tovush bilan boshlanadigan so\'zdan oldin "an" ishlatiladi.',
                'Use "an" before a word that starts with a vowel sound.',
            ],
            [
                '/(?<![\w\'])i(?![\w\'])|(?<![\w\'])i(?=\'m|\'ve|\'ll|\'d)/',
                fn () => 'I',
                'spelling',
                '"I" (men) doim bosh harf bilan yoziladi.',
                'The pronoun "I" is always a capital letter.',
            ],
        ];

        foreach ($rules as [$pattern, $fix, $type, $uz, $en]) {
            $text = preg_replace_callback($pattern, function ($m) use ($fix, $type, $uz, $en, $lang, &$corrections) {
                $replacement = $fix($m);
                $corrections[] = [
                    'original' => $m[0],
                    'corrected' => $replacement,
                    'explanation' => $lang === 'uz' ? $uz : $en,
                    'type' => $type,
                ];

                return $replacement;
            }, $text);
        }

        return [$text, $this->dedupe($corrections)];
    }

    private function dedupe(array $corrections): array
    {
        $seen = [];

        return array_values(array_filter($corrections, function ($c) use (&$seen) {
            $key = strtolower($c['original'].'|'.$c['corrected']);

            return ! isset($seen[$key]) && ($seen[$key] = true);
        }));
    }
}
