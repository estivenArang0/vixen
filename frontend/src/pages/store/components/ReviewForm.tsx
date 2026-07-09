import { useState } from 'react';
import { Star } from 'lucide-react';
import { useCreateReviewMutation } from '../../../features/reviews/reviewsApi';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useNotification } from '../../../components/ui/NotificationProvider';

interface ReviewFormProps {
  productId: string;
  userId: string;
  userNickname: string;
  onSuccess: () => void;
}

export default function ReviewForm({ productId, userId, userNickname, onSuccess }: ReviewFormProps) {
  const [createReview, { isLoading }] = useCreateReviewMutation();
  const { notify } = useNotification();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      notify({
        title: 'Falta calificación',
        message: 'Por favor selecciona una calificación antes de enviar tu reseña.',
        variant: 'error',
      });
      return;
    }
    try {
      await createReview({
        userId,
        productId,
        orderId: 'direct-review',
        orderItemId: 'direct-review',
        rating,
        title,
        content,
        userNickname,
        pros: pros || null,
        cons: cons || null,
        verifiedPurchase: false,
        anonymous: false,
        images: [],
        tags: [],
      }).unwrap();
      setRating(0);
      setTitle('');
      setContent('');
      setPros('');
      setCons('');
      onSuccess();
      notify({
        title: 'Reseña enviada',
        message: 'Gracias por compartir tu opinión. Tu reseña se publicó correctamente.',
        variant: 'success',
      });
    } catch {
      const message = 'No se pudo enviar la reseña. Por favor intenta de nuevo.';
      notify({
        title: 'Error al enviar reseña',
        message,
        variant: 'error',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Escribe una reseña</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Calificación</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500 self-center">
            {rating > 0 ? `${rating}/5` : 'Selecciona una calificación'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          label="Título de la reseña"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resume tu experiencia"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tu reseña</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="¿Qué te gustó o no te gustó de este producto?"
            rows={4}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Pros (opcional)"
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            placeholder="Lo que te gustó"
          />
          <Input
            label="Contras (opcional)"
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            placeholder="Lo que podría mejorar"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button type="submit" disabled={isLoading || rating === 0 || !title || !content}className="bg-pink-500 hover:bg-pink-600">
          {isLoading ? 'Enviando...' : 'Enviar reseña'}
        </Button>
      </div>
    </form>
  );
}