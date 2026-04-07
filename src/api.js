const BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/todos`;

export async function fetchTodos() {
  const res = await fetch(BASE);
  if (!res.ok)
    throw new Error(
      '할일 불러오기 실패',
    );
  return res.json();
}

export async function createTodo(
  title,
) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type':
        'application/json',
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok)
    throw new Error('할일 생성 실패');
  return res.json();
}

export async function updateTodo(
  id,
  data,
) {
  const res = await fetch(
    `${BASE}/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok)
    throw new Error('할일 수정 실패');
  return res.json();
}

export async function deleteTodo(id) {
  const res = await fetch(
    `${BASE}/${id}`,
    { method: 'DELETE' },
  );
  if (!res.ok)
    throw new Error('할일 삭제 실패');
  return res.json();
}
