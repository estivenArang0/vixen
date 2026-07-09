import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLoginMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import { useAppDispatch } from '../../store/hooks';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useNotification } from '../../components/ui/NotificationProvider';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { notify } = useNotification();
  const [login, { isLoading }] = useLoginMutation();

  const [form, setForm] = useState({ username: '', password: '' });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login(form).unwrap();
      dispatch(setCredentials(result));
      navigate(from, { replace: true });
    } catch {
      const message = 'No pudimos iniciar sesión. Revisa tus credenciales o intenta más tarde.';
      notify({
        title: 'Error de acceso',
        message,
        variant: 'error',
      });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Iniciar sesión en Vixen</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
