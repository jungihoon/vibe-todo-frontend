const BACKEND = 'https://vibe-todo-backend-vn21.onrender.com/todos';

export default async function handler(req, res) {
  try {
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (req.method === 'POST') {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(BACKEND, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ message: '프록시 오류', error: err.message });
  }
}
