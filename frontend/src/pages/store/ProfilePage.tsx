import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGetUserByIdQuery, useUpdateUserMutation, useChangePasswordMutation } from '../../features/users/usersApi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { useNotification } from '../../components/ui/NotificationProvider';

export default function ProfilePage() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const { data: userData, isLoading } = useGetUserByIdQuery(user!.userId);
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();
  const [changePassword, { isLoading: changingPw }] = useChangePasswordMutation();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '' });

  useEffect(() => {
    if (userData) {
      setForm({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
      });
    }
  }, [userData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser({ id: user!.userId, body: form }).unwrap();
      notify({
        title: 'Perfil actualizado',
        message: 'Tus datos se guardaron correctamente.',
        variant: 'success',
      });
    } catch {
      notify({
        title: 'Error al actualizar',
        message: 'No pudimos guardar tus datos. Intenta nuevamente más tarde.',
        variant: 'error',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changePassword({ id: user!.userId, ...pwForm }).unwrap();
      notify({
        title: 'Contraseña actualizada',
        message: 'Tu contraseña se cambió correctamente.',
        variant: 'success',
      });
      setPwForm({ oldPassword: '', newPassword: '' });
    } catch {
      notify({
        title: 'Falló el cambio de contraseña',
        message: 'No pudimos actualizar tu contraseña. Revisa tus datos e intenta de nuevo.',
        variant: 'error',
      });
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Mi perfil</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Información personal</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Apellido" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <Input label="Correo electrónico" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Teléfono" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Cambiar contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input label="Contraseña actual" type="password" value={pwForm.oldPassword} onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })} required />
          <Input label="Nueva contraseña" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
          <Button type="submit" disabled={changingPw}>{changingPw ? 'Cambiando...' : 'Cambiar contraseña'}</Button>
        </form>
      </Card>
    </div>
  );
}
