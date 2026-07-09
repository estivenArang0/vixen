import { useState, useEffect, useRef } from 'react';
import { getSlides, saveSlides } from '../../features/banners/BannerSlide';
import type { BannerSlide } from '../../features/banners/BannerSlide';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useNotification } from '../../components/ui/NotificationProvider';

interface SlideEditor extends BannerSlide {
    zoom: number;
    offsetX: number;
    offsetY: number;
}

function toEditor(s: BannerSlide): SlideEditor {
    return { ...s, zoom: 1, offsetX: 50, offsetY: 50 };
}

function ImageEditor({ slide, onChange }: { slide: SlideEditor; onChange: (s: SlideEditor) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const last = useRef({ x: 0, y: 0 });

    const onMouseDown = (e: React.MouseEvent) => {
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY };
        const newX = Math.min(100, Math.max(0, slide.offsetX + dx * 0.3));
        const newY = Math.min(100, Math.max(0, slide.offsetY + dy * 0.3));
        onChange({ ...slide, offsetX: newX, offsetY: newY });
    };

    const onMouseUp = () => { dragging.current = false; };

    return (
        <div className="space-y-3">
            <div
                ref={containerRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                className="relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing select-none"
                style={{ minHeight: '250px', background: '#111', width: '100%' }}
            >
                {slide.bg ? (
                    <img
                        src={slide.bg}
                        draggable={false}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: `${slide.offsetX}% ${slide.offsetY}%`,
                            transform: `scale(${slide.zoom})`,
                            transformOrigin: `${slide.offsetX}% ${slide.offsetY}%`,
                            pointerEvents: 'none',
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        Pega una URL para ver la imagen
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white font-bold text-sm">{slide.title}</p>
                    <p className="text-gray-200 text-xs">{slide.subtitle}</p>
                </div>
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Arrastra para mover
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horizontal: {Math.round(slide.offsetX)}%
                    </label>
                    <input
                        type="range" min={0} max={100} step={1}
                        value={slide.offsetX}
                        onChange={e => onChange({ ...slide, offsetX: parseFloat(e.target.value) })}
                        className="w-full accent-pink-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vertical: {Math.round(slide.offsetY)}%
                    </label>
                    <input
                        type="range" min={0} max={100} step={1}
                        value={slide.offsetY}
                        onChange={e => onChange({ ...slide, offsetY: parseFloat(e.target.value) })}
                        className="w-full accent-pink-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zoom: {Math.round(slide.zoom * 100)}%
                </label>
                <input
                    type="range" min={50} max={600} step={1}
                    value={slide.zoom * 100}
                    onChange={e => onChange({ ...slide, zoom: parseInt(e.target.value) / 100 })}
                    className="w-full accent-pink-500"
                />
            </div>
        </div>
    );
}

export default function BannersPage() {
    const { notify } = useNotification();
    const [slides, setSlides] = useState<SlideEditor[]>([]);

    useEffect(() => {
        setSlides(getSlides().map(toEditor));
    }, []);

    const update = (index: number, updated: SlideEditor) => {
        setSlides(slides.map((s, i) => i === index ? updated : s));
    };

    const updateField = (index: number, field: keyof BannerSlide, value: string) => {
        setSlides(slides.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    const addSlide = () => {
        setSlides([...slides, {
            title: 'Nuevo slide',
            subtitle: '',
            bg: '',
            position: '50% 50%',
            height: '250px',
            zoom: 1,
            offsetX: 50,
            offsetY: 50,
        }]);
    };

    const removeSlide = (index: number) => {
        setSlides(slides.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const toSave: BannerSlide[] = slides.map((s) => ({
            title: s.title,
            subtitle: s.subtitle,
            bg: s.bg,
            position: `${s.offsetX}% ${s.offsetY}%`,
            height: s.height,
        }));
        saveSlides(toSave);
        notify({
            title: 'Banners guardados',
            message: 'Los cambios en los banners se guardaron correctamente.',
            variant: 'success',
        });
    };

    return (
        <div className="w-full max-w-6xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Banners</h1>
                <Button onClick={handleSave}>Guardar cambios</Button>
            </div>

            <div className="space-y-6">
                {slides.map((slide, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-700">Slide {i + 1}</h2>
                            <button onClick={() => removeSlide(i)} className="text-sm text-red-500 hover:text-red-400">
                                Eliminar
                            </button>
                        </div>

                        <Input label="Título" value={slide.title} onChange={e => updateField(i, 'title', e.target.value)} />
                        <Input label="Subtítulo" value={slide.subtitle} onChange={e => updateField(i, 'subtitle', e.target.value)} />
                        <Input label="URL de imagen (Cloudinary)" value={slide.bg} onChange={e => updateField(i, 'bg', e.target.value)} />

                        <ImageEditor slide={slide} onChange={updated => update(i, updated)} />
                    </div>
                ))}
            </div>

            <button
                onClick={addSlide}
                className="mt-6 w-full rounded-xl border-2 border-dashed border-gray-300 py-4 text-sm text-gray-500 hover:border-pink-400 hover:text-pink-500 transition-colors"
            >
                + Agregar slide
            </button>
        </div>
    );
}