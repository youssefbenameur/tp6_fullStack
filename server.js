const express = require('express');
const app = express();
const PORT = 3000;

// Configuration d'EJS comme moteur de template
app.set('view engine', 'ejs');

// Middleware pour parser le JSON et les données de formulaire
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static('public'));

// Données initiales des tâches
let tasks = [
  { id: 1, title: 'Apprendre Express', done: false },
  { id: 2, title: 'Créer une application de démonstration', done: false },
  { id: 3, title: 'Découvrer EJS', done: true }
];

// ==================== ROUTES DES PAGES ====================

// Page d'accueil
app.get('/', (req, res) => {
  res.render('index', { user: 'VotreNom' }); // Remplacez "VotreNom" par votre nom
});

// Page des tâches
app.get('/tasks', (req, res) => {
  res.render('tasks', { 
    tasks: tasks,
    totalTasks: tasks.length,
    error: null
  });
});

// Page "À propos"
app.get('/about', (req, res) => {
  res.render('about');
});

// Page "Contact"
app.get('/contact', (req, res) => {
  res.render('contact');
});

// ==================== ROUTES DE L'API (JSON) ====================

// GET - Récupérer toutes les tâches (API JSON)
app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: tasks,
    total: tasks.length
  });
});

// POST - Ajouter une nouvelle tâche (API JSON)
app.post('/api/tasks', (req, res) => {
  const title = req.body.title;
  
  // Validation : empêcher les tâches sans titre
  if (!title || title.trim() === '') {
    return res.status(400).json({ 
      success: false,
      error: 'Le titre de la tâche ne peut pas être vide' 
    });
  }
  
  const newTask = {
    id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title: title.trim(),
    done: false,
    createdAt: new Date()
  };
  
  tasks.push(newTask);
  
  res.status(201).json({
    success: true,
    message: 'Tâche créée avec succès',
    data: newTask
  });
});

// GET - Récupérer une tâche spécifique (API JSON)
app.get('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: 'Tâche non trouvée'
    });
  }
  
  res.json({
    success: true,
    data: task
  });
});

// PUT - Mettre à jour une tâche (API JSON)
app.put('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Tâche non trouvée'
    });
  }
  
  const { title, done } = req.body;
  
  // Validation du titre si fourni
  if (title && title.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Le titre de la tâche ne peut pas être vide'
    });
  }
  
  // Mise à jour des champs
  if (title) tasks[taskIndex].title = title.trim();
  if (typeof done === 'boolean') tasks[taskIndex].done = done;
  
  res.json({
    success: true,
    message: 'Tâche mise à jour avec succès',
    data: tasks[taskIndex]
  });
});

// DELETE - Supprimer une tâche (API JSON)
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Tâche non trouvée'
    });
  }
  
  const deletedTask = tasks.splice(taskIndex, 1)[0];
  
  res.json({
    success: true,
    message: 'Tâche supprimée avec succès',
    data: deletedTask
  });
});

// ==================== ROUTES DES FORMULAIRES HTML ====================

// POST - Ajouter une tâche via formulaire HTML
app.post('/tasks', (req, res) => {
  const title = req.body.title;
  
  // Validation : empêcher les tâches sans titre
  if (!title || title.trim() === '') {
    return res.status(400).render('tasks', {
      tasks: tasks,
      totalTasks: tasks.length,
      error: 'Le titre de la tâche ne peut pas être vide'
    });
  }
  
  const newTask = {
    id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
    title: title.trim(),
    done: false,
    createdAt: new Date()
  };
  
  tasks.push(newTask);
  res.redirect('/tasks');
});

// POST - Marquer une tâche comme terminée/incomplète
app.post('/tasks/:id/toggle', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  
  if (task) {
    task.done = !task.done;
  }
  
  res.redirect('/tasks');
});

// POST - Supprimer une tâche
app.post('/tasks/:id/delete', (req, res) => {
  const taskId = parseInt(req.params.id);
  tasks = tasks.filter(t => t.id !== taskId);
  res.redirect('/tasks');
});

// POST - Marquer toutes les tâches comme terminées
app.post('/tasks/complete-all', (req, res) => {
  tasks.forEach(task => {
    task.done = true;
  });
  res.redirect('/tasks');
});

// POST - Supprimer toutes les tâches terminées
app.post('/tasks/clear-completed', (req, res) => {
  tasks = tasks.filter(t => !t.done);
  res.redirect('/tasks');
});

// ==================== ROUTES UTILITAIRES ====================

// Route pour les statistiques des tâches
app.get('/api/stats', (req, res) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  const pending = total - completed;
  
  res.json({
    success: true,
    data: {
      total,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  });
});

// Middleware de gestion des erreurs 404
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page non trouvée',
    message: 'Désolé, la page que vous recherchez n\'existe pas.'
  });
});

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    success: false,
    error: 'Une erreur interne du serveur est survenue'
  });
});

// ==================== DÉMARRAGE DU SERVEUR ====================

app.listen(PORT, () => {
  console.log(` Serveur en cours d'exécution sur http://localhost:${PORT}`);
  console.log(` ${tasks.length} tâches chargées`);
  console.log(` Prêt à recevoir des requêtes !`);
});

// Export pour les tests (si nécessaire)
module.exports = app;