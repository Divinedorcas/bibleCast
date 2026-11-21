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
        Schema::create('translations', function (Blueprint $table) {
            $table->id();                                           // Big integer (auto-increment PK)
            $table->string('code')->unique();                       // e.g. "kjv", "web", "niv"
            $table->string('name');                                 // e.g. "King James Version"
            $table->string('provider');                             // e.g. "bible-api.com"
            $table->boolean('is_active')->default(true);           // soft-disable a translation
            $table->boolean('is_default')->default(false);         // exactly one should be true
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
