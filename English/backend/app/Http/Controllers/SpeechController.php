<?php

namespace App\Http\Controllers;

use App\Services\OpenAi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SpeechController extends Controller
{
    public function __construct(private OpenAi $openAi) {}

    /**
     * Signed link to hear a short text (a lesson word or example), for the learner's
     * pronunciation buttons.
     */
    public function url(Request $request): JsonResponse
    {
        $data = $request->validate(['text' => ['required', 'string', 'max:300']]);

        return response()->json([
            'url' => URL::temporarySignedRoute('speech.speak', now()->addHours(2), ['text' => $data['text']], absolute: false),
        ]);
    }

    public function speak(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'max:1500'],
        ]);

        $audio = $this->openAi->speech($data['text'], config('services.ai.tts_model'), config('services.ai.tts_voice'));

        return response()->stream(function () use ($audio) {
            while (! $audio->eof()) {
                echo $audio->read(8192);
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            }
        }, 200, [
            'Content-Type' => 'audio/mpeg',
            'Cache-Control' => 'private, max-age=3600',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
