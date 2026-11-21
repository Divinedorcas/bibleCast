<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('projections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reference');
            $table->string('translation_code')->default('kjv');
            $table->text('passage_text');
            $table->json('verses_json')->nullable();
            $table->string('status')->default('projected'); // 'projected', 'cleared', 'blackout'
            $table->string('mode')->default('manual');       // 'manual', 'voice_detected', 'queue'
            $table->timestamp('projected_at')->nullable();
            $table->timestamp('cleared_at')->nullable();
            $table->timestamps();

            $table->index(['reference', 'status']);
            $table->index('projected_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projections');
    }
};
