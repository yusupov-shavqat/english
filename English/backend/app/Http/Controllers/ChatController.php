<?php

namespace App\Http\Controllers;

use App\Contracts\EnglishTutor;
use App\Curriculum\Curriculum;
use App\Models\Conversation;
use App\Models\User;
use App\Services\OpenAi;
use App\Support\TutorSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ChatController extends Controller
{
    private const HISTORY_LIMIT = 30;

    private const MIN_UTTERANCES = 3;

    /** Share of mistake-free utterances (%) needed to pass a lesson. */
    private const PASS_SCORE = 50;

    public function __construct(private EnglishTutor $tutor) {}

    public function start(Request $request): JsonResponse
    {
        $data = $request->validate([
            'level' => ['required', Rule::in(TutorSettings::LEVELS)],
            'topic' => ['nullable', 'string', 'max:200'],
            'explanation_language' => ['required', Rule::in(TutorSettings::EXPLANATION_LANGUAGES)],
            'unit' => ['nullable', Rule::in(Curriculum::slugs())],
        ]);

        $unit = filled($data['unit'] ?? null) ? Curriculum::find($data['unit']) : null;

        $conversation = $request->user()->conversations()->create([
            'explanation_language' => $data['explanation_language'],
            // The course is A1–A2, so lesson practice always uses the simplest register.
            'level' => $unit ? 'beginner' : $data['level'],
            'topic' => $unit['title'] ?? (filled($data['topic'] ?? null) ? trim($data['topic']) : null),
            'unit_slug' => $unit['slug'] ?? null,
        ]);

        $reply = $this->tutor->start($conversation->settings());
        $conversation->messages()->create(['role' => 'assistant', 'content' => $reply]);

        return response()->json([
            'conversation_id' => $conversation->id,
            'reply' => $reply,
            'audio_url' => $this->audioUrl($reply),
        ]);
    }

    /**
     * One spoken turn: transcribe the learner's audio, then stream back newline-delimited JSON
     * events as each part is ready: transcript, reply, check (or error).
     */
    public function turn(Request $request, Conversation $conversation, OpenAi $openAi): StreamedResponse
    {
        $this->authorizeOwner($request, $conversation);
        $request->validate(['audio' => ['required', 'file', 'max:10240']]);

        $settings = $conversation->settings();
        $history = $conversation->history(self::HISTORY_LIMIT);
        $transcript = $openAi->transcribe($request->file('audio'), config('services.ai.transcribe_model'));

        return response()->stream(function () use ($conversation, $settings, $history, $transcript) {
            $emit = function (string $type, array $payload = []) {
                echo json_encode(['type' => $type, ...$payload], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            };

            $emit('transcript', ['text' => $transcript]);
            if ($transcript === '') {
                return;
            }

            $userMessage = $conversation->messages()->create(['role' => 'user', 'content' => $transcript]);

            try {
                $check = $this->tutor->respond($settings, $history, $transcript, function (string $reply) use ($conversation, $emit) {
                    $conversation->messages()->create(['role' => 'assistant', 'content' => $reply]);
                    $emit('reply', ['text' => $reply, 'audio_url' => $this->audioUrl($reply)]);
                });
                $userMessage->update($check);
                $emit('check', $check);
            } catch (Throwable $e) {
                report($e);
                $emit('error', ['message' => "AI xizmatiga ulanib bo'lmadi. Qaytadan gapirib ko'ring."]);
            }
        }, 200, [
            'Content-Type' => 'application/x-ndjson',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /**
     * Close the conversation and let the tutor update what it remembers about the learner.
     */
    public function finish(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeOwner($request, $conversation);
        $data = $request->validate(['duration_seconds' => ['required', 'integer', 'min:0', 'max:86400']]);

        $user = $request->user();
        $transcript = $conversation->messages()->orderBy('id')->get(['role', 'content', 'corrections'])->toArray();
        $spoke = collect($transcript)->contains('role', 'user');

        $conversation->update(['ended_at' => now(), 'duration_seconds' => $data['duration_seconds']]);
        $unitResult = $conversation->unit_slug ? $this->recordUnitPractice($user, $conversation->unit_slug, $transcript) : null;

        if ($spoke) {
            try {
                $user->update(['profile' => $this->tutor->remember($conversation->settings(), $transcript)]);
            } catch (Throwable $e) {
                // The session is still saved; the profile just catches up next time.
                report($e);
            }
        }

        return response()->json(['profile' => $user->profile, 'unit' => $unitResult]);
    }

    /**
     * Scores a lesson practice by the share of utterances without mistakes. A unit counts as
     * completed once one practice has at least MIN_UTTERANCES utterances and PASS_SCORE.
     */
    private function recordUnitPractice(User $user, string $slug, array $transcript): array
    {
        $said = collect($transcript)->where('role', 'user');
        $score = $said->isEmpty() ? null : (int) round($said->filter(fn ($m) => empty($m['corrections']))->count() / $said->count() * 100);

        $progress = $user->unitProgress()->firstOrNew(['unit_slug' => $slug]);
        $progress->practices++;
        if ($score !== null && $score > ($progress->best_score ?? -1)) {
            $progress->best_score = $score;
        }
        if ($said->count() >= self::MIN_UTTERANCES && $score >= self::PASS_SCORE) {
            $progress->completed_at ??= now();
        }
        $progress->save();

        return [
            ...$progress->toSummary(),
            'score' => $score,
            'spoken' => $said->count(),
            'needed' => self::MIN_UTTERANCES,
            'pass_score' => self::PASS_SCORE,
        ];
    }

    private function authorizeOwner(Request $request, Conversation $conversation): void
    {
        abort_unless($conversation->user_id === $request->user()->id, 404);
    }

    /** Short-lived link to the spoken version of $text, usable by an <audio> element. */
    private function audioUrl(string $text): string
    {
        return URL::temporarySignedRoute('speech.speak', now()->addMinutes(30), ['text' => $text], absolute: false);
    }
}
