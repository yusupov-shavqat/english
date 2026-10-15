<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\StreamInterface;
use RuntimeException;

/**
 * Thin client for the OpenAI REST API: chat, speech-to-text and text-to-speech.
 */
class OpenAi
{
    private const BASE_URL = 'https://api.openai.com/v1/';
    private ?Client $client = null;

    public function __construct(private ?string $apiKey) {}

    /**
     * Starts a chat completion without waiting for it. Requests started from the same
     * instance run concurrently, so waiting on one also advances the others.
     *
     * @return PromiseInterface resolving to the message content string
     */
    public function chatAsync(array $payload): PromiseInterface
    {
        return $this->client()
            ->postAsync('chat/completions', ['json' => $payload])
            ->then(function (ResponseInterface $response) {
                $content = json_decode((string) $response->getBody(), true)['choices'][0]['message']['content'] ?? null;

                if (! is_string($content)) {
                    throw new RuntimeException('AI returned an unexpected response.');
                }

                return $content;
            });
    }

    public function transcribe(UploadedFile $audio, string $model): string
    {
        $response = $this->request()
            ->attach('file', $audio->getContent(), $audio->getClientOriginalName() ?: 'speech.webm')
            ->post('audio/transcriptions', [
                'model' => $model,
                'language' => 'en',
                'response_format' => 'json',
                // Keep the learner's mistakes: we need what they actually said, not a cleaned-up version.
                'prompt' => 'An English learner speaking. Transcribe exactly what is said, word for word, keeping every grammar mistake. Do not correct anything.',
            ])
            ->throw();

        return trim($response->json('text') ?? '');
    }

    /** Returns a stream of MP3 bytes, so playback can start before synthesis finishes. */
    public function speech(string $text, string $model, string $voice): StreamInterface
    {
        return $this->request()
            ->withOptions(['stream' => true])
            ->post('audio/speech', [
                'model' => $model,
                'voice' => $voice,
                'input' => $text,
                'instructions' => 'You are English, a warm and cheerful young woman chatting with a friend. Sound natural and human, smile in your voice, and speak clearly and a little slower than usual for an English learner.',
                'response_format' => 'mp3',
            ])
            ->throw()
            ->toPsrResponse()
            ->getBody();
    }

    private function client(): Client
    {
        return $this->client ??= new Client([
            'base_uri' => self::BASE_URL,
            'headers' => ['Authorization' => 'Bearer '.$this->key()],
            'timeout' => 60,
        ]);
    }

    private function key(): string
    {
        if (! $this->apiKey) {
            throw new RuntimeException('AI_API_KEY is not set.');
        }

        return $this->apiKey;
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl(self::BASE_URL)
            ->withToken($this->key())
            ->timeout(60)
            // Retry network hiccups, rate limits and server errors, but not bad requests.
            ->retry(2, 500, fn ($e) => ! $e instanceof RequestException || $e->response->status() >= 429, throw: false);
    }
}
