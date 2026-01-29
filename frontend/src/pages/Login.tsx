import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useMutation } from '@tanstack/react-query';
import { login } from '../services/auth';
import { LoginPayload } from '../types/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({ mutationFn: login });

  return (
    <Stack spacing={2} component="form" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <Typography variant="h5">Вход</Typography>
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
        Войти
      </Button>
    </Stack>
  );
}
