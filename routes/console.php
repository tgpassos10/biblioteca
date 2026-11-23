<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('biblioteca:funcionario {email} {--promover}', function (string $email) {
    $usuario = User::where('email', $email)->first();
    if ($this->option('promover')) {
        if (!$usuario || !$this->confirm('Conceder acesso de funcionário a esta conta?')) {
            return 1;
        }
    } else {
        if ($usuario) {
            $this->error('O e-mail já está cadastrado. Use --promover apenas para uma conta de funcionário.');
            return 1;
        }
        $dados = Validator::make([
            'name' => $this->ask('Nome'),
            'email' => $email,
            'password' => $this->secret('Senha'),
            'password_confirmation' => $this->secret('Confirme a senha'),
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()->symbols()],
        ])->validate();

        $usuario = new User($dados);
        $usuario->email_verified_at = now();
    }

    $usuario->funcionario = true;
    $usuario->save();
    $this->info('Acesso de funcionário configurado.');
})->purpose('Provisiona o acesso de um funcionário da biblioteca');
