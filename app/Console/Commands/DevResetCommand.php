<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class DevResetCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'dev:reset';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all caches, reset the SQLite database, and run migrations.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Clearing config cache...');
        Artisan::call('config:clear');
        $this->info(Artisan::output());

        $this->info('Clearing route cache...');
        Artisan::call('route:clear');
        $this->info(Artisan::output());

        $this->info('Clearing view cache...');
        Artisan::call('view:clear');
        $this->info(Artisan::output());

        $this->info('Dumping autoload...');
        exec('composer dump-autoload');

        $this->info('Resetting SQLite database...');
        $dbPath = database_path('database.sqlite');
        if (file_exists($dbPath)) {
            unlink($dbPath);
            $this->info('Deleted existing SQLite database.');
        }
        touch($dbPath);
        $this->info('Created new SQLite database.');

        // Ensure session table migration exists
        $sessionMigrationExists = false;
        $migrationsPath = database_path('migrations');
        foreach (scandir($migrationsPath) as $file) {
            if (strpos($file, 'create_sessions_table') !== false) {
                $sessionMigrationExists = true;
                break;
            }
        }
        if (!$sessionMigrationExists) {
            $this->info('Generating session table migration...');
            Artisan::call('session:table');
            $this->info(Artisan::output());
        }

        $this->info('Running migrations...');
        Artisan::call('migrate:fresh');
        $this->info(Artisan::output());

        $this->info('Seeding database...');
        Artisan::call('db:seed');
        $this->info(Artisan::output());

        // Now clear cache (cache table exists)
        $this->info('Clearing application cache...');
        Artisan::call('cache:clear');
        $this->info(Artisan::output());

        $this->info('Development environment has been reset!');
    }
} 