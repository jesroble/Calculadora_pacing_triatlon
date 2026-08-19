// CRÍTICO: las claves de nivel superior (distancia, experiencia, temp, gut, categoriaPeso,
// desnivelCat, terrain) y las claves internas de cada una (p.ej. 'Baja', 'Media', 'Alta')
// son los valores canónicos que App.jsx usa como estado, como clave de búsqueda en
// DATA_703/DATA_FULL/gutTable, y en comparaciones (===). NUNCA renombrar, eliminar ni
// "traducir" esas claves — solo editar los strings es/en de cada entrada.
export const CATEGORY_LABELS = {
  distancia: {
    '70.3': { es: '70.3', en: '70.3' },
    'Ironman Full': { es: 'Ironman Full', en: 'Ironman Full' },
  },
  experiencia: {
    Baja: { es: 'Baja', en: 'Beginner' },
    Media: { es: 'Media', en: 'Intermediate' },
    Alta: { es: 'Alta', en: 'Advanced' },
  },
  temp: {
    Fría: { es: 'Fría', en: 'Cold' },
    Moderada: { es: 'Moderada', en: 'Mild' },
    Calor: { es: 'Calor', en: 'Hot' },
  },
  gut: {
    Bajo: { es: 'Bajo', en: 'Low' },
    Medio: { es: 'Medio', en: 'Medium' },
    Alto: { es: 'Alto', en: 'High' },
    Elite: { es: 'Elite', en: 'Elite' },
  },
  categoriaPeso: {
    Ligero: { es: 'Ligero', en: 'Light' },
    Medio: { es: 'Medio', en: 'Medium' },
    Pesado: { es: 'Pesado', en: 'Heavy' },
  },
  desnivelCat: {
    Bajo: { es: 'Bajo', en: 'Low' },
    Medio: { es: 'Medio', en: 'Medium' },
    Alto: { es: 'Alto', en: 'High' },
  },
  // No es clave de cálculo, pero se comparte aquí porque el nombre de cada terreno
  // se repite a mano en App.jsx y en shareImage.js — una sola fuente evita que diverjan.
  terrain: {
    Subidas: { es: 'Subidas', en: 'Climbs' },
    Llano: { es: 'Llano', en: 'Flats' },
    Bajadas: { es: 'Bajadas', en: 'Descents' },
  },
}
