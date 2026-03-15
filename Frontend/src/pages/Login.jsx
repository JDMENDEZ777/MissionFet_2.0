import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. IMPORTAR
import api from '../api/axios';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate(); // 2. INICIALIZAR

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('/login', formData);
      
      localStorage.setItem('token', response.data.access_token);
      
      alert('¡Bienvenido ' + response.data.user.name + '!');
      
      // 3. REDIRIGIR AL DASHBOARD
      navigate('/dashboard'); 
      
    } catch (error) {
      console.error('Error:', error.response);
      alert('Error: ' + (error.response?.data?.message || 'No se pudo conectar'));
    }
  };



  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-xl w-96">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Login MissionFet 2.0</h2>
        
        <input 
          className="w-full p-3 mb-4 border rounded bg-gray-50"
          type="email" 
          placeholder="Correo Electrónico"
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        
        <input 
          className="w-full p-3 mb-6 border rounded bg-gray-50"
          type="password" 
          placeholder="Contraseña"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        
        <button className="w-full p-3 text-white transition bg-blue-600 rounded hover:bg-blue-700">
          Iniciar Sesión
        </button>
      </form>
    </div>
  );
}