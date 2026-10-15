<?php

namespace App\Curriculum;

class Curriculum
{
    private static ?array $units = null;

    /** @return array<int, array<string, mixed>> units in course order, each with its 1-based "number" */
    public static function all(): array
    {
        if (self::$units === null) {
            $units = require __DIR__.'/units.php';
            foreach ($units as $i => $unit) {
                $units[$i] = ['number' => $i + 1, ...$unit];
            }
            self::$units = $units;
        }

        return self::$units;
    }

    public static function find(string $slug): ?array
    {
        foreach (self::all() as $unit) {
            if ($unit['slug'] === $slug) {
                return $unit;
            }
        }

        return null;
    }

    public static function slugs(): array
    {
        return array_column(self::all(), 'slug');
    }
}
