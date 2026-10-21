<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // These optional personalization columns are also present in the original
        // cycle_profiles creation migration. Check individually so this migration
        // remains safe for fresh databases and databases created from older schemas.
        $columns = [
            'birth_date' => fn (Blueprint $table) => $table->date('birth_date')->nullable(),
            'contraception_type' => fn (Blueprint $table) => $table->string('contraception_type', 32)->nullable(),
            'primary_goal' => fn (Blueprint $table) => $table->string('primary_goal', 32)->default('track_cycle'),
            'birth_time' => fn (Blueprint $table) => $table->time('birth_time')->nullable(),
            'birth_place' => fn (Blueprint $table) => $table->string('birth_place', 160)->nullable(),
            'sun_sign' => fn (Blueprint $table) => $table->string('sun_sign', 16)->nullable(),
            'moon_sign' => fn (Blueprint $table) => $table->string('moon_sign', 16)->nullable(),
            'rising_sign' => fn (Blueprint $table) => $table->string('rising_sign', 16)->nullable(),
            'onboarding_completed' => fn (Blueprint $table) => $table->boolean('onboarding_completed')->default(false),
        ];

        foreach ($columns as $name => $addColumn) {
            if (!Schema::hasColumn('cycle_profiles', $name)) {
                Schema::table('cycle_profiles', function (Blueprint $table) use ($addColumn) {
                    $addColumn($table);
                });
            }
        }
    }

    public function down(): void
    {
        // Intentionally leave these columns in place: some are defined by the
        // original create-table migration, so dropping them here could remove
        // schema owned by that earlier migration.
    }
};
