import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../features/auth/authApi';
import { setCredentials } from '../../features/auth/authSlice';
import { useAppDispatch } from '../../store/hooks';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

type FormErrors = {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
};

function validate(form: typeof initialForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.firstName.trim()) errors.firstName = 'El nombre es requerido.';
  if (!form.lastName.trim()) errors.lastName = 'El apellido es requerido.';

  if (!form.username.trim()) {
    errors.username = 'El usuario es requerido.';
  } else if (form.username.length < 3) {
    errors.username = 'El usuario debe tener al menos 3 caracteres.';
  }

  if (!form.email.trim()) {
    errors.email = 'El correo es requerido.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'El correo no tiene un formato válido.';
  }

  if (!form.phoneNumber.trim()) {
    errors.phoneNumber = 'El teléfono es requerido.';
  } else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phoneNumber)) {
    errors.phoneNumber = 'El teléfono no es válido.';
  }

  if (!form.password) {
    errors.password = 'La contraseña es requerida.';
  } else if (form.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres.';
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = 'Debe incluir al menos una mayúscula.';
  } else if (!/[a-z]/.test(form.password)) {
    errors.password = 'Debe incluir al menos una minúscula.';
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = 'Debe incluir al menos un número.';
  } else if (!/[^A-Za-z0-9]/.test(form.password)) {
    errors.password = 'Debe incluir al menos un carácter especial (!@#$...).';
  }

  return errors;
}

const initialForm = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors((prev) => ({ ...prev, [field]: undefined })); // limpiar error al escribir
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    try {
      const result = await register(form).unwrap();
      dispatch(setCredentials(result));
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      setServerError(message || 'Error al crear la cuenta. Intenta de nuevo.');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Crear Cuenta</h1>

          {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{serverError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input label="Nombre" value={form.firstName} onChange={set('firstName')} />
                {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div>
                <Input label="Apellido" value={form.lastName} onChange={set('lastName')} />
                {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <Input label="Usuario" value={form.username} onChange={set('username')} />
              {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
            </div>

            <div>
              <Input label="Correo electrónico" type="email" value={form.email} onChange={set('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <Input label="Teléfono" placeholder="+573001234567" value={form.phoneNumber} onChange={set('phoneNumber')} />
              {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>}
            </div>

            <div>
              <Input label="Contraseña" type="password" value={form.password} onChange={set('password')} />
              {errors.password
                ? <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                : <p className="mt-1 text-xs text-gray-500">Mín. 8 caracteres, letras y numeros.</p>
              }
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}