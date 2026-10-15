<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('unit_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('unit_slug', 60);
            $table->timestamp('lesson_viewed_at')->nullable();
            $table->unsignedInteger('practices')->default(0);
            // Share of utterances without mistakes in the best practice, 0-100.
            $table->unsignedTinyInteger('best_score')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'unit_slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('unit_progress');
    }
};
