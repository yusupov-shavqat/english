<?php

namespace App\Http\Controllers;

use App\Curriculum\Curriculum;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class UnitController extends Controller
{
    private const EMPTY_PROGRESS = ['lesson_viewed' => false, 'practices' => 0, 'best_score' => null, 'stars' => 0, 'completed' => false];

    public function index(Request $request): JsonResponse
    {
        $progress = $request->user()->unitProgress()->get()->keyBy('unit_slug');

        $units = array_map(fn (array $unit) => [
            ...Arr::only($unit, ['slug', 'number', 'level', 'title', 'title_uz', 'goal_uz']),
            'progress' => $progress->get($unit['slug'])?->toSummary() ?? self::EMPTY_PROGRESS,
        ], Curriculum::all());

        // The first unit not finished yet is the one to suggest.
        $next = collect($units)->first(fn ($u) => ! $u['progress']['completed'])['slug'] ?? null;

        return response()->json(['units' => $units, 'next' => $next]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $unit = Curriculum::find($slug) ?? abort(404);

        $progress = $request->user()->unitProgress()->firstOrNew(['unit_slug' => $slug]);
        $progress->lesson_viewed_at ??= now();
        $progress->save();

        return response()->json([
            'unit' => Arr::except($unit, ['focus', 'questions']),
            'progress' => $progress->toSummary(),
        ]);
    }
}
