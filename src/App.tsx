import './App.css';
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy, Timestamp, deleteDoc, doc, updateDoc  } from "firebase/firestore";
import { db } from "./firebase";

type Todo = {
  id: string;
  title: string;
  content?: string;
  createdAt?: Timestamp | null;
};

function App() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingContent, setEditingContent] = useState("");

  const addTodo = async () => {
    if (!title) return;

    await addDoc(collection(db, "todos"), {
      title,
      content,
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setContent("");

    const q = query(collection(db, "todos"), orderBy("createdAt", "asc"));

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as { title: string; content?: string; createdAt?: Timestamp }),
    }));

    setTodos(data);
  };

  const deleteTodo = async (id: string) => {
    await deleteDoc(doc(db, "todos", id));

    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setEditingContent(todo.content || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;

    await updateDoc(doc(db, "todos", editingId), {
      title: editingTitle,
      content: editingContent,
    });

    setTodos((prev) =>
      prev.map((t) =>
        t.id === editingId ? { ...t, title: editingTitle, content: editingContent } : t
      ),
    );

    setEditingId(null);
    setEditingTitle("");
    setEditingContent("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingContent("");
  };

  useEffect(() => {
    const loadTodos = async () => {
      const q = query(collection(db, "todos"), orderBy("createdAt", "asc"));

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as { title: string, content?: string, createdAt: Timestamp }),
      }));

      setTodos(data);
    };

    loadTodos();
  }, []);

  return (
    <div className="app-container">
      <h1>🔥 Firebase Todo</h1>

      <div className="input-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="input-title"
        />

        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Content (addition)"
          className="input-content"
        />

        <button className="btn-primary" onClick={addTodo}>Add</button>
      </div>

      <div className="table-wrapper">
        <table className="todo-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Title</th>
              <th>Content (addition)</th>
              <th>Create Time</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {todos.map((t, idx) => (
              <tr key={t.id}>
                <td>{idx + 1}</td>

                {editingId === t.id ? (
                  <>
                    <td>
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                      />
                    </td>

                    <td>
                      <input
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                      />
                    </td>

                    <td>{t.createdAt ? t.createdAt.toDate().toLocaleString() : ""}</td>

                    <td className="actions">
                      <button className="btn-save" onClick={saveEdit}>💾 Save</button>
                      <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{t.title}</td>
                    <td>{t.content || ""}</td>
                    <td>{t.createdAt ? t.createdAt.toDate().toLocaleString() : ""}</td>

                    <td className="actions">
                      <button className="btn-edit" onClick={() => startEdit(t)}>✏️ Edit</button>
                      <button className="btn-delete" onClick={() => deleteTodo(t.id)}>❌ Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
