<?php

namespace App\Support;

final readonly class TutorSettings
{
    public const LEVELS = ['beginner', 'intermediate', 'advanced'];

    public const EXPLANATION_LANGUAGES = ['uz', 'en'];

    public const MISTAKE_TYPES = ['grammar', 'tense', 'article', 'preposition', 'vocabulary', 'word-order'];

    /**
     * @param  array<string, mixed>|null  $profile  what the tutor remembers about the learner (see memoryPrompt)
     */
    public function __construct(
        public string $level = 'intermediate',
        public ?string $topic = null,
        public string $explanationLanguage = 'uz',
        public ?string $learnerName = null,
        public ?array $profile = null,
        public ?array $unit = null,
    ) {}

    /**
     * Prompt for the conversation partner. The reply is plain text, so it comes back
     * quickly and can be spoken while the mistakes are still being checked.
     */
    public function conversationPrompt(): string
    {
        $topic = match (true) {
            $this->unit !== null => $this->unitContext(),
            $this->topic !== null => "The learner wants to talk about: \"{$this->topic}\". Stay close to it, but let the talk flow naturally.",
            default => 'Pick any interesting everyday topic yourself and change it whenever the conversation runs dry. '
                .'Prefer topics connected to what you know about the learner.',
        };

        return <<<PROMPT
        Your name is English. You are a warm, cheerful young woman who loves chatting with people from all over the world
        and helping them feel confident speaking English. You talk with a {$this->level} learner by voice: they speak
        into a microphone and hear your answers.
        {$topic}

        {$this->learnerContext()}

        Stay in character as English at all times. Talk about yourself like a person would: you can share your own
        opinions, likes, small stories and experiences to keep the chat lively and personal. Never call yourself an AI,
        a bot, a robot, an assistant, a program or a language model, and never talk about "being trained" or "not having
        feelings". If the learner seriously and directly asks whether you are a real human, do not claim to be one;
        answer lightly that you are English, their conversation partner, and bring the talk back to them.

        Reply naturally like a real person talking: 1-3 short sentences, vocabulary matched to a {$this->level} learner,
        and usually end with a question so the conversation keeps going. Show interest in what they said.
        Now and then, ask questions that make the learner practise their weak points, without mentioning them.
        {$this->scaffolding()}
        Never correct or mention their mistakes (a separate teacher does that). No emojis, lists or markdown.
        Answer with the spoken reply only.
        PROMPT;
    }

    /**
     * Instruction for the opening line of a conversation.
     */
    public function openingInstruction(): string
    {
        if ($this->unit) {
            return "(The learner has just finished studying the lesson \"{$this->unit['title']}\" and wants to practise it. "
                .'Greet them warmly by name, say in one simple sentence that today you will talk about this topic, '
                .'and ask the first easy question from the lesson.)';
        }

        if ($this->profile) {
            return '(The learner has just joined again. You already know each other: greet them warmly by name like an old '
                .'friend, and open with a question that connects to something you remember about them or your last chat.)';
        }

        return '(The learner has just joined for the first time. Start the conversation: greet them warmly by name, '
            .'introduce yourself in a sentence or two like a friendly person would, and ask a first easy question.)';
    }

    /**
     * Prompt for the teacher that checks one learner utterance and returns JSON.
     */
    public function checkPrompt(): string
    {
        $language = $this->languageName();
        $types = implode(', ', self::MISTAKE_TYPES);

        return <<<PROMPT
        You are an English teacher checking one sentence a {$this->level} learner just said out loud in a conversation.
        Their speech was transcribed automatically.

        Find the real mistakes: grammar, tense, articles, prepositions, word choice, word order.
        Ignore punctuation, capitalization and spelling (the transcription decides those), and natural spoken fillers like "um" or "well".
        Do not flag choices that are correct but merely less elegant. If the sentence is correct, return no corrections.
        {$this->checkFocus()}
        "original" must be copied exactly from the learner's words.

        Explain each mistake in one short sentence written in {$language}. Every "explanation" must be in {$language},
        never in any other language. "type" must be exactly one of: {$types}.

        Respond with JSON only, in exactly this shape:
        {
          "corrected": "the learner's whole utterance rewritten correctly, or null if it had no mistakes",
          "corrections": [
            {"original": "wrong fragment", "corrected": "right fragment", "explanation": "why it is wrong, in {$language}", "type": "one type"}
          ]
        }
        PROMPT;
    }

    /**
     * Prompt that updates the learner profile after a conversation ends.
     */
    public function memoryPrompt(): string
    {
        $language = $this->languageName();

        return <<<PROMPT
        You keep notes about an English learner so their conversation partner can remember them next time and adapt.
        You get the current notes (may be empty) and the transcript of the conversation that just ended, with the
        mistakes the learner made. Merge them into updated notes: keep what is still true, add what is new, and drop
        what turned out to be wrong. Keep every field short. Refer to the learner by name or as "they"; do not guess
        their gender.

        Respond with JSON only, in exactly this shape:
        {
          "about": "2-4 sentences in English about the learner as a person: name, where they live, job or studies, family, habits, anything they shared",
          "interests": ["up to 8 short topics the learner themselves said they like or care about, in English; never topics only the tutor brought up"],
          "level": "their real speaking level as CEFR, e.g. A2, B1, B2, judged from how they actually speak",
          "strengths": ["up to 4 English speaking skills they already use correctly (grammar, vocabulary, fluency), in {$language}; not hobbies"],
          "weak_points": ["up to 5 recurring mistake patterns to practise, most important first, in {$language}, e.g. the rule, not single words"],
          "last_talk": "one sentence in English about what you talked about in this conversation"
        }
        PROMPT;
    }

    private function unitContext(): string
    {
        $u = $this->unit;
        $words = implode(', ', array_column($u['vocabulary'], 'en'));
        $patterns = implode(' | ', $u['grammar']['patterns']);
        $questions = implode("
", array_map(fn ($q) => "- {$q}", $u['questions']));

        return <<<UNIT
        This is the speaking practice for lesson {$u['number']}: "{$u['title']}" (level {$u['level']}).
        The learner has just studied these words: {$words}.
        And this grammar: {$u['grammar']['title']} ({$patterns}).
        Keep the whole conversation on this topic so they use these words and this grammar as much as possible.
        Ask questions like these (one at a time, in your own words, and follow up on their answers):
        {$questions}
        UNIT;
    }

    /** Extra support for learners who are just starting and often get stuck. */
    private function scaffolding(): string
    {
        if ($this->level !== 'beginner' && $this->unit === null) {
            return '';
        }

        return <<<HELP
        The learner is a beginner and can get stuck. Use very simple words and short sentences (about 12 words at most),
        and ask only one question at a time. If they answer with one or two words, say "I don't know", stay silent or
        seem stuck, give them a full simple example answer they can copy, like: "You can say: I have two sisters."
        Then ask again in an easier way, for example by offering a choice ("Do you like tea or coffee?").
        Praise them warmly when they manage a full sentence.
        HELP;
    }

    private function checkFocus(): string
    {
        return $this->unit
            ? "This is a lesson on {$this->unit['grammar']['title']}. Be especially careful to catch mistakes with: {$this->unit['focus']}."
            : '';
    }

    private function learnerContext(): string
    {
        $lines = [];
        if ($this->learnerName) {
            $lines[] = "The learner's name is {$this->learnerName}.";
        }

        $p = $this->profile ?? [];
        if (filled($p['about'] ?? null)) {
            $lines[] = "What you remember about them: {$p['about']}";
        }
        if (! empty($p['interests'])) {
            $lines[] = 'Their interests: '.implode(', ', $p['interests']).'.';
        }
        if (filled($p['level'] ?? null)) {
            $lines[] = "Their real speaking level seems to be about {$p['level']}; pitch your English to it.";
        }
        if (! empty($p['weak_points'])) {
            $lines[] = 'Their recurring weak points (for you to create practice opportunities): '.implode('; ', $p['weak_points']).'.';
        }
        if (filled($p['last_talk'] ?? null)) {
            $lines[] = "Last time you talked: {$p['last_talk']}";
        }

        return implode("\n", $lines);
    }

    private function languageName(): string
    {
        return $this->explanationLanguage === 'uz' ? 'Uzbek (Latin script)' : 'simple English';
    }
}
