import { useState } from 'react';
import api from '../api/axios';

const PREDEFINED_AVATARS = [
    { url: 'https://cdn-icons-png.flaticon.com/512/2721/2721620.png', name: 'Programador' },
    { url: 'https://cdn-icons-png.flaticon.com/512/2721/2721623.png', name: 'Desarrolladora' },
    { url: 'https://cdn-icons-png.flaticon.com/512/2721/2721629.png', name: 'Ingeniero de Software' },
    { url: 'https://cdn-icons-png.flaticon.com/512/4319/4319132.png', name: 'Desarrollador Web' },
    { url: 'https://cdn-icons-png.flaticon.com/512/2721/2721631.png', name: 'Analista de Datos' },
    { url: 'https://cdn-icons-png.flaticon.com/512/1995/1995539.png', name: 'Diseñador UX/UI' },
    { url: 'https://cdn-icons-png.flaticon.com/512/2721/2721626.png', name: 'Ingeniera de Sistemas' },
    { url: 'https://cdn-icons-png.flaticon.com/512/4319/4319128.png', name: 'Desarrollador Móvil' },
    { url: 'https://cdn-icons-png.flaticon.com/512/2721/2721622.png', name: 'Experto en Ciberseguridad' },
    { url: 'https://cdn-icons-png.flaticon.com/512/4319/4319130.png', name: 'Científica de Datos' },
    { url: 'https://cdn-icons-png.flaticon.com/512/2721/2721624.png', name: 'Administrador de Sistemas' },
    { url: 'https://cdn-icons-png.flaticon.com/512/4319/4319131.png', name: 'Desarrolladora Frontend' }
];

export default function AvatarModal({ isOpen, onClose, currentAvatar, onAvatarUpdate }) {
    const [selectedAvatarUrl, setSelectedAvatarUrl] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(currentAvatar);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSelectPredefined = (url) => {
        setSelectedAvatarUrl(url);
        setFile(null);
        setPreview(url);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('El archivo es demasiado grande (máximo 2MB)');
                return;
            }
            setFile(file);
            setSelectedAvatarUrl('');
            
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        if (file) {
            formData.append('avatar_file', file);
        } else if (selectedAvatarUrl) {
            formData.append('avatar_url', selectedAvatarUrl);
        } else {
            alert('Por favor selecciona un avatar o sube una imagen');
            setLoading(false);
            return;
        }

        try {
            const { data } = await api.post('/perfil/avatar', formData);
            if (data.status === 'success') {
                localStorage.setItem('user_avatar', data.user.avatar);
                onAvatarUpdate(data.user.avatar);
                onClose();
            }
        } catch (err) {
            console.error(err);
            alert('Error al actualizar el avatar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content avatar-modal" onClick={e => e.stopPropagation()}>
                <div className="card-header">
                    <h2 className="card-title"><i className="fas fa-user-circle"></i> Cambiar Avatar</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <div className="avatar-preview-section">
                    <img src={preview || '/IMG/user-placeholder.png'} alt="Preview" className="avatar-current-preview" />
                    <p>Vista previa</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <h3 className="section-subtitle">Elige un avatar predefinido</h3>
                    <div className="avatar-grid-selection">
                        {PREDEFINED_AVATARS.map((av, idx) => (
                            <div 
                                key={idx} 
                                className={`avatar-item-opt ${selectedAvatarUrl === av.url ? 'active' : ''}`}
                                onClick={() => handleSelectPredefined(av.url)}
                                title={av.name}
                            >
                                <img src={av.url} alt={av.name} />
                            </div>
                        ))}
                    </div>

                    <div className="upload-avatar-section">
                        <h3 className="section-subtitle">O sube tu propia imagen</h3>
                        <div className="custom-file-input-wrapper">
                            <input 
                                type="file" 
                                id="avatar-file-upload" 
                                accept="image/*" 
                                onChange={handleFileChange}
                                className="hidden-file-input"
                            />
                            <label htmlFor="avatar-file-upload" className="file-label-btn">
                                <i className="fas fa-cloud-upload-alt"></i> {file ? file.name : 'Seleccionar archivo'}
                            </label>
                            <small>Formatos: JPG, PNG, GIF. Máx 2MB.</small>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
