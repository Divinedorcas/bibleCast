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
        Schema::create('projection_queues', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reference', 100);
            $table->string('translation_code', 20)->default('kjv');
            $table->string('passage_preview', 255)->nullable();
            $table->text('passage_text')->nullable();
            $table->json('verses_json')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('status')->default('pending'); // 'pending', 'projected', 'skipped'
            $table->timestamps();

            $table->index(['sort_order', 'status']);
            $table->index('reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projection_queues');
    }
};
