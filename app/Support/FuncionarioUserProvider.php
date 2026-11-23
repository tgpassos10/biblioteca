<?php

namespace App\Support;

use Illuminate\Auth\EloquentUserProvider;

class FuncionarioUserProvider extends EloquentUserProvider
{
    protected function newModelQuery($model = null)
    {
        return parent::newModelQuery($model)->where('funcionario', true);
    }
}
