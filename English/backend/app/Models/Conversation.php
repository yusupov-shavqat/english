<?php

namespace App\Models;

use App\Curriculum\Curriculum;
use App\Support\TutorSettings;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['level', 'topic', 'explanation_language', 'unit_slug', 'duration_seconds', 'ended_at'])]
class Conversation extends Model
{
    protected function casts(): array
    {
        return [
            'ended_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function settings(): TutorSettings
    {
        return new TutorSettings(
            level: $this->level,
            topic: $this->topic,
            explanationLanguage: $this->explanation_language,
            learnerName: $this->user->name,
            profile: $this->user->profile,
            unit: $this->unit_slug ? Curriculum::find($this->unit_slug) : null,
        );
    }

    /**
     * The latest turns, oldest first, in the shape the tutor expects.
     *
     * @return array<int, array{role: string, content: string}>
     */
    public function history(int $limit = 30): array
    {
        return $this->messages()->latest('id')->limit($limit)->get(['role', 'content'])
            ->reverse()
            ->map(fn (Message $m) => ['role' => $m->role, 'content' => $m->content])
            ->values()
            ->all();
    }
}
