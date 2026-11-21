<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Translation;

class TranslationSeeder extends Seeder
{
    /**
     * Seed the translations table with the translations
     * supported by https://bible-api.com.
     */
    public function run(): void
    {
        $translations = [
            [
                'code'       => 'kjv',
                'name'       => 'King James Version',
                'provider'   => 'bible-api.com',
                'is_active'  => true,
                'is_default' => true,
            ],
            [
                'code'       => 'web',
                'name'       => 'World English Bible',
                'provider'   => 'bible-api.com',
                'is_active'  => true,
                'is_default' => false,
            ],
            [
                'code'       => 'bbe',
                'name'       => 'Bible in Basic English',
                'provider'   => 'bible-api.com',
                'is_active'  => true,
                'is_default' => false,
            ],
            [
                'code'       => 'oeb-cw',
                'name'       => 'Open English Bible (Commonwealth)',
                'provider'   => 'bible-api.com',
                'is_active'  => true,
                'is_default' => false,
            ],
            [
                'code'       => 'webbe',
                'name'       => 'World English Bible (British Edition)',
                'provider'   => 'bible-api.com',
                'is_active'  => true,
                'is_default' => false,
            ],
            [
                'code'       => 'clementine',
                'name'       => 'Clementine Latin Vulgate',
                'provider'   => 'bible-api.com',
                'is_active'  => false,
                'is_default' => false,
            ],
            [
                'code'       => 'almeida',
                'name'       => 'João Ferreira de Almeida (Portuguese)',
                'provider'   => 'bible-api.com',
                'is_active'  => false,
                'is_default' => false,
            ],
            [
                'code'       => 'rccv',
                'name'       => 'Romanian Corrected Cornilescu Version',
                'provider'   => 'bible-api.com',
                'is_active'  => false,
                'is_default' => false,
            ],
        ];

        foreach ($translations as $data) {
            Translation::updateOrCreate(
                ['code' => $data['code']],
                $data
            );
        }
    }
}
