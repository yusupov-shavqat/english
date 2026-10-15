<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['unit_slug', 'lesson_viewed_at', 'practices', 'best_score', 'completed_at'])]
class UnitProgress extends Model
{
    protected $table = 'unit_progress';

    protected function casts(): array
    {
        return [
            'lesson_viewed_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public static function stars(?int $score): int
    {
        return match (true) {
            $score === null => 0,
            $score >= 80 => 3,
            $score >= 50 => 2,
            default => 1,
        };
    }

    public function toSummary(): array
    {
        return [
            'lesson_viewed' => $this->lesson_viewed_at !== null,
            'practices' => $this->practices ?? 0,
            'best_score' => $this->best_score,
            'stars' => self::stars($this->best_score),
            'completed' => $this->completed_at !== null,
        ];
    }
}
