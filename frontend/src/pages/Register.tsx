import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useMutation } from '@tanstack/react-query';
import { register as registerUser } from '../services/auth';
import { RegisterPayload } from '../types/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterPayload>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({ mutationFn: registerUser });

  return (
    <Stack spacing={2} component="form" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <Typography variant="h5">Регистрация</Typography>
      <TextField
        label="Email"
        {...register('email')}
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
      />
      <TextField
        label="Пароль"
        type="password"
        {...register('password')}
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
      />
      <Button variant="contained" type="submit" disabled={mutation.isPending}>
        Создать аккаунт
      </Button>
    </Stack>
  );
}
