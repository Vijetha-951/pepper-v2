import React, { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL; // CRA-compatible

export default function AddProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    type: "Bush",
    category: "Bush Pepper",
    description: "",
    price: "",
    stock: "",
    image: "",
  });
  const [editingId, setEditingId] = useState(null);

  // Fetch all products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add or update product
  const handleSubmit = async () => {
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId
        ? `${API_URL}/products/${editingId}`
        : `${API_URL}/products`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });

      const data = await res.json();
      setForm({
        name: "",
        type: "Bush",
        category: "Bush Pepper",
        description: "",
        price: "",
        stock: "",
        image: "",
      });
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      console.error("Add/Update product error:", err);
    }
  };

  // Edit product
  const handleEdit = (p) => {
    setForm({
      name: p.name,
      type: p.type,
      category: p.category,
      description: p.description,
      price: p.price,
      stock: p.stock,
      image: p.image,
    });
    setEditingId(p._id);
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Product Management</h1>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="Bush">Bush</option>
          <option value="Climber">Climber</option>
        </select>
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
        />
        <input
          type="text"
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
        />
        <input
          type="number"
          name="stock"
          placeholder="Stock"
          value={form.stock}
          onChange={handleChange}
        />
        <input
          type="text"
          name="image"
          placeholder="Image URL"
          value={form.image}
          onChange={handleChange}
        />
        <button onClick={handleSubmit}>
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </div>

      <h2>Product List</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Category</th>
            <th>Description</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Image</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.type}</td>
              <td>{p.category}</td>
              <td>{p.description}</td>
              <td>₹{p.price}</td>
              <td>{p.stock}</td>
              <td>{p.image && <img src={p.image} alt={p.name} width="50" />}</td>
              <td>
                <button onClick={() => handleEdit(p)}>Edit</button>
                <button onClick={() => handleDelete(p._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
