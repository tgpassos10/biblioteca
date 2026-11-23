<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_registration_is_disabled(): void
    {
        $this->get('/register')->assertNotFound();
        $this->post('/register')->assertNotFound();
    }

    public function test_reader_cannot_log_in_or_access_the_panel_api(): void
    {
        $leitor = User::factory()->create();

        $this->post('/login', ['email' => $leitor->email, 'password' => 'password'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();

        $this->actingAs($leitor)->getJson('/api/livros')->assertForbidden();
    }

    public function test_staff_can_register_reader_without_password(): void
    {
        $funcionario = User::factory()->funcionario()->create();

        $resposta = $this->actingAs($funcionario)->postJson('/api/usuarios', [
            'name' => 'Leitora de teste',
            'email' => 'leitora@example.com',
        ])->assertCreated();

        $id = $resposta->json('id');
        $this->assertDatabaseHas('users', ['id' => $id, 'funcionario' => false]);
        $this->assertDatabaseHas('operacoes_auditoria', [
            'ator_id' => $funcionario->id,
            'registro_id' => $id,
            'entidade' => 'users',
            'acao' => 'cadastro',
        ]);
        $this->getJson('/api/usuarios')->assertExactJson([
            ['id' => $id, 'name' => 'Leitora de teste'],
        ]);
    }
}
